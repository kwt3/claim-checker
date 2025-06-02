import React, { useState } from "react";

export default function App() {
  const [mode, setMode] = useState("checker");
  const [rawData, setRawData] = useState("");
  const [totalItems, setTotalItems] = useState("");
  const [results, setResults] = useState(null);
  const [assignmentResults, setAssignmentResults] = useState(null);
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  function processClaims(rawData, totalItems) {
    const matches = rawData.match(/\d+/g) || [];
    const claimedSet = new Set(matches.map(Number));
    const fullSet = new Set(Array.from({ length: totalItems }, (_, i) => i + 1));

    const unclaimed = Array.from(fullSet)
      .filter((num) => !claimedSet.has(num))
      .sort((a, b) => a - b);

    const claimedCount = claimedSet.size;
    const unclaimedCount = unclaimed.length;
    const percentClaimed = (claimedCount / totalItems) * 100;
    const percentUnclaimed = (unclaimedCount / totalItems) * 100;

    return {
      claimed: Array.from(claimedSet).sort((a, b) => a - b),
      unclaimed,
      countClaimed: claimedCount,
      countUnclaimed: unclaimedCount,
      percentClaimed: percentClaimed.toFixed(2),
      percentUnclaimed: percentUnclaimed.toFixed(2),
    };
  }

  function parseClaims(raw) {
    const lines = raw.trim().split(/\r?\n/);
    const claims = {};
    let currentUser = null;
    for (let line of lines) {
      if (!line.trim()) continue;
      if (!/[0-9]/.test(line)) {
        currentUser = line.trim();
        claims[currentUser] = [];
      } else if (currentUser) {
        const nums = line.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        claims[currentUser].push(...nums);
      }
    }
    return claims;
  }

  function assignClaims(gomsClaims, userClaims) {
    const allClaims = { ...gomsClaims, ...userClaims };
    const demandCounter = {};

    Object.values(allClaims).flat().forEach(item => {
      demandCounter[item] = (demandCounter[item] || 0) + 1;
    });

    const priorityScore = (items) => {
      const total = items.length;
      const lowDemand = items.filter(i => demandCounter[i] === 1).length;
      const highDemand = items.filter(i => demandCounter[i] > 3).length;
      return total * 5 + lowDemand * 3 - highDemand * 2;
    };

    const sortedUsers = Object.entries(userClaims)
      .sort(([, itemsA], [, itemsB]) => priorityScore(itemsB) - priorityScore(itemsA));

    const itemAssignment = {};
    const results = {};

    Object.entries(gomsClaims).forEach(([gom, items]) => {
      results[gom] = { got: [], missed: [] };
      items.forEach(item => {
        itemAssignment[item] = gom;
        results[gom].got.push(item);
      });
    });

    sortedUsers.forEach(([user, items]) => {
      results[user] = { got: [], missed: [] };
      items.forEach(item => {
        if (!itemAssignment[item]) {
          itemAssignment[item] = user;
          results[user].got.push(item);
        } else if (itemAssignment[item] !== user) {
          results[user].missed.push({ item, takenBy: itemAssignment[item] });
        }
      });
    });

    return results;
  }

  const handleGenerate = () => {
    const total = parseInt(totalItems, 10);
    if (!rawData.trim() || isNaN(total) || total < 1) {
      alert("Please provide both raw claim data and a valid total number.");
      return;
    }
    if (mode === "checker") {
      const result = processClaims(rawData, total);
      setResults(result);
      setAssignmentResults(null);
      setLookupResult(null);
    } else if (mode === "assigner") {
      const lines = rawData.trim().split(/\r?\n/);
      const gomsRaw = lines.slice(0, 2).join("\n");
      const usersRaw = lines.slice(2).join("\n");
      const goms = parseClaims(gomsRaw);
      const users = parseClaims(usersRaw);
      const result = assignClaims(goms, users);
      setAssignmentResults(result);
      setResults(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto font-sans text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">Claim Tool</h1>

      <div className="flex justify-center gap-4 mb-4">
        <button onClick={() => setMode("checker")} className={`px-4 py-2 rounded font-semibold ${mode === "checker" ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-600"}`}>
          📊 Claim Checker
        </button>
        <button onClick={() => setMode("assigner")} className={`px-4 py-2 rounded font-semibold ${mode === "assigner" ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-600"}`}>
          🎯 Claim Assigner
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-4">
        <textarea
          rows={6}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded resize-none bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Paste raw claimed numbers here..."
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
        />

        <input
          type="number"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Enter total number of items (e.g., 483)"
          value={totalItems}
          onChange={(e) => setTotalItems(e.target.value)}
        />

        <div className="flex flex-wrap gap-4">
          <button onClick={handleGenerate} className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            Generate Results
          </button>
          <button onClick={() => {
            setRawData("");
            setTotalItems("");
            setResults(null);
            setAssignmentResults(null);
            setLookupNumber("");
            setLookupResult(null);
          }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
            🔄 Reset
          </button>
        </div>
      </div>

      {mode === "checker" && results && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">📈 Stats Summary</h2>
          <ul className="space-y-1">
            <li>Total: {totalItems}</li>
            <li>Claimed: {results.countClaimed}</li>
            <li>Unclaimed: {results.countUnclaimed}</li>
            <li>% Claimed: {results.percentClaimed}%</li>
            <li>% Unclaimed: {results.percentUnclaimed}%</li>
          </ul>
          <h3 className="text-lg font-semibold mt-6 mb-2">Unclaimed Numbers</h3>
          <div className="text-sm bg-white dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600 rounded max-h-60 overflow-y-auto whitespace-pre-wrap">
            {results.unclaimed.join(", ")}
          </div>
        </div>
      )}

      {mode === "checker" && results && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">🔍 Check Specific Number</h2>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="number"
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter number to check..."
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
            />
            <button onClick={() => {
              const number = parseInt(lookupNumber, 10);
              setLookupResult(results.claimed.includes(number));
            }} className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
              Check
            </button>
            {lookupResult !== null && (
              <span className="text-lg font-semibold">
                {lookupResult ? "✅ Claimed" : "❌ Unclaimed"}
              </span>
            )}
          </div>
        </div>
      )}

      {mode === "assigner" && assignmentResults && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">📋 Assignment Results</h2>
          {Object.entries(assignmentResults).map(([user, info]) => (
            <div key={user} className="mb-4">
              <h3 className="font-bold text-lg">{user}</h3>
              <p><strong>Got:</strong> {info.got.sort((a, b) => a - b).join(", ")}</p>
              {info.missed.length > 0 && (
                <div>
                  <strong>Missed:</strong>
                  <ul className="list-disc list-inside">
                    {info.missed.map(({ item, takenBy }) => (
                      <li key={item}>Item {item} taken by {takenBy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
