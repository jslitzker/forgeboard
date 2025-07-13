import React from 'react'

const TailwindTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600">Tailwind Test</h1>
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
        This should have a gradient background
      </div>
      <div className="mt-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
        This should have a gray background
      </div>
      <div className="mt-4 p-4 border-2 border-purple-500 rounded-lg">
        This should have a purple border
      </div>
    </div>
  )
}

export default TailwindTest