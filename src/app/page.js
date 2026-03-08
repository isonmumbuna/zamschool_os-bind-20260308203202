"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const handleButtonClick = (value) => {
    if (value === "=") {
      try {
        // Using eval for simplicity. For production, consider a safer math expression parser.
        setResult(eval(input).toString());
        setInput(eval(input).toString()); // Keep result in input for chaining operations
      } catch (error) {
        setResult("Error");
      }
    } else if (value === "C") {
      setInput("");
      setResult("");
    } else if (value === "DEL") {
      setInput(input.slice(0, -1));
    } else {
      setInput((prevInput) => prevInput + value);
    }
  };

  const buttons = [
    "C", "DEL", "/", "*",
    "7", "8", "9", "-",
    "4", "5", "6", "+",
    "1", "2", "3", "=",
    "0", ".",
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Display */}
        <div className="p-6 bg-gray-700 text-right rounded-t-xl">
          <div className="text-gray-400 text-xl h-8 overflow-hidden">
            {input}
          </div>
          <div className="text-white text-5xl font-bold h-16 flex items-center justify-end overflow-hidden">
            {result || "0"}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2 p-4">
          {buttons.map((button) => (
            <button
              key={button}
              onClick={() => handleButtonClick(button)}
              className={`
                col-span-${button === "0" ? "2" : "1"}
                p-4 rounded-lg text-white text-2xl font-semibold
                transition-all duration-200 ease-in-out
                ${
                  ["C", "DEL"].includes(button)
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                    : ["/", "*", "-", "+", "="].includes(button)
                    ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700"
                    : "bg-gray-600 hover:bg-gray-700 active:bg-gray-800"
                }
                ${button === "=" ? "col-span-2" : ""}
              `}
            >
              {button}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
