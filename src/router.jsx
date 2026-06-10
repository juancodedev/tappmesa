/**
 * Router Configuration — React Router v7
 *
 * TODO: Migrar desde el API legacy (BrowserRouter + Routes/Route en App.jsx)
 * hacia createBrowserRouter + RouterProvider.
 *
 * Beneficios de la migracion:
 * - Data loaders: fetching antes de renderizar el componente
 * - Actions: manejo de formularios a nivel de ruta
 * - Code splitting nativo por ruta
 * - Error boundaries por ruta
 * - TypeScript inference en params
 *
 * Uso propuesto:
 *
 * 1. En main.jsx, reemplazar BrowserRouter por RouterProvider:
 *    import { RouterProvider } from 'react-router-dom'
 *    import { router } from './router'
 *    root.render(<RouterProvider router={router} />)
 *
 * 2. Agregar loaders a las paginas:
 *    export async function loader({ params, request }) {
 *      const tenant = await loadTenant(params.slug)
 *      return { tenant }
 *    }
 *
 * 3. Las paginas acceden a los datos via useLoaderData():
 *    import { useLoaderData } from 'react-router-dom'
 *    function Page() {
 *      const { tenant } = useLoaderData()
 *    }
 */

// import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
//
// export const router = createBrowserRouter(
//   createRoutesFromElements(
//     <Route element={<RootLayout />}>
//       <Route index element={<LandingPage />} />
//       <Route path="/admin/*" element={<SecureAdminApp />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<RegisterPage />} />
//       <Route path="/:slug/:table" element={<TableApp />} />
//       <Route path="/*" element={<AppContent />} />
//     </Route>
//   )
// )
