function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🍽️ Tappmesa
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          La forma más fácil de gestionar tu cafetería o tetería
        </p>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="space-y-4">
            <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors touch-target">
              Crear mi local
            </button>
            <button className="w-full border-2 border-primary text-primary py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors touch-target">
              Ver demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App