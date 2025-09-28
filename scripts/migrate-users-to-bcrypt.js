#!/usr/bin/env node

/**
 * Migration script to transition users from SHA-256 to bcrypt
 * Run this after disabling Vercel deployment protection
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Replicate the SHA-256 hash function used in the frontend
async function tempHashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'tappmesa-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function migrateUsersToBcrypt() {
  console.log('🔄 Starting user migration from SHA-256 to bcrypt...\n');

  try {
    // 1. Get all users that need password reset
    console.log('📋 Fetching users that need migration...');
    const { data: users, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, needs_password_reset')
      .eq('needs_password_reset', true)
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (!users || users.length === 0) {
      console.log('✅ No users need migration. All users are already using bcrypt.');
      return;
    }

    console.log(`📊 Found ${users.length} users that need migration:\n`);

    // 2. For each user, generate a password reset token
    const migrationResults = [];

    for (const user of users) {
      console.log(`🔄 Processing user: ${user.email}`);

      try {
        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 24); // 24 hours expiry

        // Store reset token in database
        const { error: resetError } = await supabase
          .from('password_reset_tokens')
          .insert([
            {
              user_id: user.id,
              token: resetToken,
              expires_at: resetExpires.toISOString(),
              created_at: new Date().toISOString()
            }
          ]);

        if (resetError) throw resetError;

        migrationResults.push({
          email: user.email,
          resetToken,
          resetExpires: resetExpires.toISOString(),
          status: 'success'
        });

        console.log(`✅ Generated reset token for ${user.email}`);

      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
        migrationResults.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // 3. Generate migration report
    console.log('\n📊 Migration Results:');
    console.log('='.repeat(50));

    const successful = migrationResults.filter(r => r.status === 'success');
    const failed = migrationResults.filter(r => r.status === 'error');

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📊 Total: ${migrationResults.length}\n`);

    // 4. Generate password reset URLs for successful migrations
    if (successful.length > 0) {
      console.log('🔗 Password Reset URLs:');
      console.log('='.repeat(50));

      const baseUrl = process.env.REACT_APP_BASE_URL || 'https://tappmesa-7b8j822rz-cljmunoz-gmailcoms-projects.vercel.app';

      successful.forEach(result => {
        const resetUrl = `${baseUrl}/reset-password?token=${result.resetToken}`;
        console.log(`📧 ${result.email}`);
        console.log(`   🔗 ${resetUrl}`);
        console.log(`   ⏰ Expires: ${new Date(result.resetExpires).toLocaleString()}\n`);
      });
    }

    // 5. Show failed migrations
    if (failed.length > 0) {
      console.log('❌ Failed Migrations:');
      console.log('='.repeat(50));

      failed.forEach(result => {
        console.log(`📧 ${result.email}: ${result.error}`);
      });
      console.log('');
    }

    // 6. Next steps
    console.log('📋 Next Steps:');
    console.log('='.repeat(50));
    console.log('1. 📧 Send password reset emails to users');
    console.log('2. 🔧 Implement password reset form in frontend');
    console.log('3. ✅ Test bcrypt authentication flow');
    console.log('4. 🗑️  Clean up SHA-256 hashes after migration');
    console.log('');

    console.log('✅ Migration preparation completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Function to verify a user's current password (for testing)
async function verifyCurrentPassword(email, password) {
  try {
    const sha256Hash = await tempHashPassword(password);

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', sha256Hash)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to complete password reset with bcrypt
async function completePasswordReset(resetToken, newPassword) {
  try {
    // 1. Verify reset token
    const { data: resetRecord, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select(`
        *,
        admin_user:admin_users(*)
      `)
      .eq('token', resetToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetRecord) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // 2. Hash new password with bcrypt
    const bcryptHash = await bcrypt.hash(newPassword, 12);

    // 3. Update user password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: bcryptHash,
        needs_password_reset: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetRecord.user_id);

    if (updateError) throw updateError;

    // 4. Delete used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', resetToken);

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      await migrateUsersToBcrypt();
      break;

    case 'verify':
      const email = process.argv[3];
      const password = process.argv[4];
      if (!email || !password) {
        console.error('Usage: node migrate-users-to-bcrypt.js verify <email> <password>');
        process.exit(1);
      }
      const result = await verifyCurrentPassword(email, password);
      console.log(result.success ? '✅ Password verified' : `❌ ${result.error}`);
      break;

    case 'reset':
      const token = process.argv[3];
      const newPass = process.argv[4];
      if (!token || !newPass) {
        console.error('Usage: node migrate-users-to-bcrypt.js reset <token> <new-password>');
        process.exit(1);
      }
      const resetResult = await completePasswordReset(token, newPass);
      console.log(resetResult.success ? '✅ Password reset successful' : `❌ ${resetResult.error}`);
      break;

    default:
      console.log('Usage:');
      console.log('  node migrate-users-to-bcrypt.js migrate        # Migrate all users');
      console.log('  node migrate-users-to-bcrypt.js verify <email> <password>  # Verify current password');
      console.log('  node migrate-users-to-bcrypt.js reset <token> <new-password>  # Complete password reset');
      break;
  }
}

export { migrateUsersToBcrypt, verifyCurrentPassword, completePasswordReset };