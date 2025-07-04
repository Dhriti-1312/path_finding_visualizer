import React, { useState } from "react";
import axios from "axios";
import Select from 'react-select';
import { CiRoute } from "react-icons/ci";
import { CiRuler } from "react-icons/ci";
import { FaRandom } from "react-icons/fa";
import "./pathFindingVisualizer.css";

const GRID_SIZE = 15;

const PathFindingVisualizer = () => {
    const [grid, setGrid] = useState(
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill("empty"))
    );
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [path, setPath] = useState([]);
    const [algorithm, setAlgorithm] = useState("dijkstra");
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState("light");
    const [mouseIsPressed, setMouseIsPressed] = useState(false);
    const [dragMode, setDragMode] = useState("wall");
    const [placementMode, setPlacementMode] = useState("wall");

    const [visitedCount, setVisitedCount] = useState(0);
    const [pathLength, setPathLength] = useState(0);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const handleCellClick = (row, col) => {
        const cellType = grid[row][col];

        if (placementMode === "start") {
            if (startNode) {
                updateGrid(startNode.row, startNode.col, "empty");
            }
            updateGrid(row, col, "start");
            setStartNode({ row, col });

        } else if (placementMode === "end") {
            if (endNode) {
                updateGrid(endNode.row, endNode.col, "empty");
            }
            updateGrid(row, col, "end");
            setEndNode({ row, col });

        } else if (placementMode === "wall") {
            // Clear start or end node if replaced with wall
            if (startNode && startNode.row === row && startNode.col === col) {
                setStartNode(null);
            }
            if (endNode && endNode.row === row && endNode.col === col) {
                setEndNode(null);
            }
            const newType = cellType === "wall" ? "empty" : "wall";
            updateGrid(row, col, newType);

        } else if (placementMode === "empty") {
            // Clear start or end node if removed manually
            if (startNode && startNode.row === row && startNode.col === col) {
                setStartNode(null);
            }
            if (endNode && endNode.row === row && endNode.col === col) {
                setEndNode(null);
            }
            updateGrid(row, col, "empty");
        }
    };


    const handleMouseDown = (row, col) => {
        if (placementMode !== "wall") return;
        const cellType = grid[row][col];
        const mode = cellType === "wall" ? "erase" : "wall";
        setDragMode(mode);
        updateGrid(row, col, mode);
        setMouseIsPressed(true);
    };

    const handleMouseEnter = (row, col) => {
        if (!mouseIsPressed || placementMode !== "wall") return;
        updateGrid(row, col, dragMode);
    };

    const handleMouseUp = () => {
        setMouseIsPressed(false);
    };

    const clearWalls = () => {
        setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => (cell === "wall" ? "empty" : cell))));
    };

    const clearAll = () => {
        setStartNode(null);
        setEndNode(null);
        setPath([]);
        setVisitedCount(0);
        setPathLength(0);
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill("empty")));
    };

    const updateGrid = (row, col, type) => {
        setGrid((prevGrid) => {
            const newGrid = prevGrid.map((rowArray) => [...rowArray]);
            newGrid[row][col] = type;
            return newGrid;
        });
    };

    // Converts grid cell types to 0/1 matrix for backend
    const transformGridToGraph = (grid) => {
        return grid.map((row) => row.map((cell) => (cell === "wall" ? 0 : 1)));
    };

    const findPath = async () => {
        if (!startNode || !endNode) {
            alert("Select both start and end nodes first!");
            return;
        }

        if (!grid || !grid.length) {
            alert("Grid not initialized!");
            return;
        }

        clearVisitedPath();

        setLoading(true);
        try {
            const requestBody = {
                algorithm: algorithm.toLowerCase(),
                start: startNode.row * grid.length + startNode.col,
                end: endNode.row * grid.length + endNode.col,
                graph: transformGridToGraph(grid),
            };

            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE}/api/pathfinder/find`,
                requestBody,
                { headers: { "Content-Type": "application/json" } }
            );


            const visitedNodes = response.data.visitedNodes || [];
            const shortestPath = response.data.shortestPath || [];

            
            animateVisitedNodes(visitedNodes, () => {
                setVisitedCount(visitedNodes.length);
                const isValidPath =
                    Array.isArray(shortestPath) &&
                    shortestPath.length > 0 &&
                    shortestPath.every((node) => typeof node === "string" && node.startsWith("Node "));

                if (!isValidPath) {
                    setPathLength(0);
                    alert("❌ No path found! Try removing some walls.");
                } else {
                    setPathLength(shortestPath.length);
                    setPath(shortestPath);
                    highlightPath(shortestPath);
                }
            });

        } catch (error) {
            console.error("Error fetching the path:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearVisitedPath = () => {
        setVisitedCount(0);
        setPathLength(0);
        setPath([]);
        setGrid((prevGrid) =>
            prevGrid.map((row) =>
                row.map((cell) =>
                    cell.startsWith("path") || cell === "visited" ? "empty" : cell
                )
            )
        );
    };

    const highlightPath = (pathNodes) => {
        setGrid((prevGrid) => {
            const numCols = prevGrid[0].length;
            const newGrid = prevGrid.map((rowArray) => [...rowArray]);

            pathNodes.forEach((nodeString) => {
                const nodeIndex = parseInt(nodeString.replace("Node ", ""), 10);
                const row = Math.floor(nodeIndex / numCols);
                const col = nodeIndex % numCols;

                if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[row].length && newGrid[row][col] !== "start" && newGrid[row][col] !== "end") {
                    newGrid[row][col] = "path";
                }
            });

            return newGrid;
        });
    };

    const animateVisitedNodes = (visitedNodes, callback) => {
        if (!Array.isArray(visitedNodes) || visitedNodes.length === 0) {
            callback();
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            if (i >= visitedNodes.length) {
                clearInterval(interval);
                callback();
                return;
            }

            const nodeIndex = parseInt(visitedNodes[i].replace("Node ", ""), 10);
            i++;

            setGrid((prevGrid) => {
                const numCols = prevGrid[0].length;
                const row = Math.floor(nodeIndex / numCols);
                const col = nodeIndex % numCols;
                const newGrid = prevGrid.map((rowArray) => [...rowArray]);

                if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[row].length && newGrid[row][col] === "empty") {
                    newGrid[row][col] = "visited";
                }
                return newGrid;
            });
        }, 20);
    };

    return (
        <div className={`visualizer-wrapper ${theme}`}>
            {/* Navbar */}
            <div className="navbar">
                <h2 className="project-title">PathQuest</h2>
                <Select
                    options={[
                        { value: 'dijkstra', label: "Dijkstra's" },
                        { value: 'bfs', label: 'BFS' },
                        { value: 'dfs', label: 'DFS' }
                    ]}
                    defaultValue={{ value: algorithm, label: algorithm.charAt(0).toUpperCase() + algorithm.slice(1) }}
                    onChange={(selected) => {
                        setAlgorithm(selected.value);

                        // Reset visited/path visuals and stats
                        setVisitedCount(0);
                        setPathLength(0);
                        setPath([]);

                        // Clear visited/path cells from grid
                        setGrid((prevGrid) =>
                            prevGrid.map((row) =>
                                row.map((cell) =>
                                    cell.startsWith("path") || cell === "visited" ? "empty" : cell
                                )
                            )
                        );
                    }}
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: '#799ce9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '2px 4px',
                            fontWeight: 600,
                            minWidth: '160px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: '#799ce9',
                            borderRadius: '8px',
                            zIndex: 9999,
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#5b83d9' : '#799ce9',
                            color: 'white',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: 'white',
                            filter: 'blur(0.3px)',
                        }),
                        dropdownIndicator: (base) => ({
                            ...base,
                            color: 'white',
                        }),
                        indicatorSeparator: () => ({ display: 'none' }),
                    }}
                />

                <button onClick={findPath} disabled={loading}>
                    {loading ? "Finding..." : "Find Path"}
                </button>
                <button onClick={() => setPlacementMode("start")}>Set Start</button>
                <button onClick={() => setPlacementMode("end")}>Set End</button>
                <button onClick={() => setPlacementMode("wall")}>Draw Walls</button>
                <button onClick={clearWalls}>Clear Walls</button>
                <button onClick={clearAll}>Reset Grid</button>
                <button onClick={toggleTheme}>
                    {theme === "light" ? "🌙" : "☀️"}
                </button>
            </div>

            {/* Combined Info Bar */}
            <div className="info-bar">
            <div className="legend horizontal">
                <div className="legend-item">
                <div className="legend-color empty"></div>
                <span>Empty</span>
                </div>
                <div className="legend-item">
                <div className="legend-color wall"></div>
                <span>Wall</span>
                </div>
                <div className="legend-item">
                <div className="legend-color start"></div>
                <span>Start</span>
                </div>
                <div className="legend-item">
                <div className="legend-color end"></div>
                <span>End</span>
                </div>
                <div className="legend-item">
                <div className="legend-color path"></div>
                <span>Path</span>
                </div>
            </div>

            <div className="stats horizontal">
                <div className="stat-item">
                    <CiRoute className="icon"/>
                    Visited Nodes: <strong>{visitedCount}</strong>
                    </div>
                    <div className="stat-item">
                    <CiRuler className="icon"/>
                    Path Length: <strong>{pathLength}</strong>
                    </div>
                    <div className="stat-item fixed">
                    <FaRandom className="icon"/>
                    Algorithm: <strong>{algorithm.toUpperCase()}</strong>
                    </div>
            </div>
            </div>

        

            {/* Grid */}
            <div className="grid">
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <div
                                key={colIndex}
                                className={`cell ${cell}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                                onMouseUp={handleMouseUp}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PathFindingVisualizer;
