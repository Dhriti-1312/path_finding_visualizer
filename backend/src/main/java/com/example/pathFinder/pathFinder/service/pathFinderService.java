package com.example.pathFinder.pathFinder.service;

import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class pathFinderService {
    public Map<String,List<String>> findPath(String algorithm, int[][] graph, int start, int end) {
        System.out.println("Algorithm: " + algorithm);
        System.out.println("Graph: " + Arrays.deepToString(graph));
        System.out.println("Start Node: " + start);
        System.out.println("End Node: " + end);

        List<String> visitedNodes = new ArrayList<>();
        List<String> shortestPath;
        switch (algorithm.toLowerCase()) {
            case "dijkstra":
                shortestPath = dijkstra(graph, start, end, visitedNodes);
                break;
            case "bfs":
                shortestPath = bfs(graph, start, end, visitedNodes);
                break;
            case "dfs":
                shortestPath = dfs(graph, start, end, visitedNodes);
                break;
            default:
                return Map.of("error", List.of("Invalid algorithm"));
        }
        return Map.of(
            "visitedNodes", visitedNodes,
            "shortestPath", shortestPath
        );
    }

    private List<String> dijkstra(int[][] graph, int start, int end, List<String> visitedNodes) {
        int n = graph.length;
        int m = graph[0].length;
        int totalNodes = n * m;
        int[] dist = new int[totalNodes];
        int[] prev = new int[totalNodes];
        boolean[] visited = new boolean[totalNodes];

        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(prev, -1);
        dist[start] = 0;

        PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.comparingInt(node -> dist[node]));
        pq.add(start);

        int[][] directions = { {0, 1}, {1, 0}, {0, -1}, {-1, 0} };

        while (!pq.isEmpty()) {
            int node = pq.poll();
            if (visited[node]) continue;
            visited[node] = true;
            visitedNodes.add("Node " + node);

            if (node == end) break;

            int row = node / m;
            int col = node % m;

            for (int[] direction : directions) {
                int neighborRow = row + direction[0];
                int neighborCol = col + direction[1];

                if (neighborRow >= 0 && neighborRow < n && neighborCol >= 0 && neighborCol < m) {
                    int neighbor = neighborRow * m + neighborCol;
                    if (!visited[neighbor] && graph[neighborRow][neighborCol] > 0) {
                        int newDist = dist[node] + graph[neighborRow][neighborCol];
                        if (newDist < dist[neighbor]) {
                            dist[neighbor] = newDist;
                            prev[neighbor] = node;
                            pq.add(neighbor);
                        }
                    }
                }
            }
            System.out.println("Processing node: " + node);
            System.out.println("Current distances: " + Arrays.toString(dist));
            System.out.println("Previous nodes: " + Arrays.toString(prev));
        }

        return reconstructPath(prev, start, end);
    }

    private List<String> bfs(int[][] graph, int start, int end, List<String> visitedNodes) {
        int n = graph.length;
        int m = graph[0].length;
        int totalNodes = n * m;
        Queue<Integer> q = new LinkedList<>();
        int[] prev = new int[totalNodes];
        boolean[] visited = new boolean[totalNodes];

        Arrays.fill(prev, -1);
        q.add(start);
        visited[start] = true;

        int node = -1;
        while (!q.isEmpty()) {
            node = q.poll();
            if (node == end) {
                return reconstructPath(prev, start, end);
            }

            int row = node / m;
            int col = node % m;
            int[][] directions = { {0, 1}, {1, 0}, {0, -1}, {-1, 0} };

            for (int[] direction : directions) {
                int neighborRow = row + direction[0];
                int neighborCol = col + direction[1];

                if (neighborRow >= 0 && neighborRow < n && neighborCol >= 0 && neighborCol < m) {
                    int neighbor = neighborRow * m + neighborCol;
                    if (!visited[neighbor] && graph[neighborRow][neighborCol] > 0) {
                        visited[neighbor] = true;
                        visitedNodes.add("Node " + neighbor);
                        prev[neighbor] = node;
                        q.add(neighbor);
                    }
                }
            }
        }
        System.out.println("Finished BFS. Last processed node: " + node);
        System.out.println("Previous nodes: " + Arrays.toString(prev));
        return Collections.singletonList("No path found");
    }

    private List<String> dfs(int[][] graph, int start, int end, List<String> visitedNodes) {
        int n = graph.length;
        int m = graph[0].length;
        boolean[] visited = new boolean[n * m];
        List<Integer> path = new ArrayList<>();

        if (dfsHelper(graph, start, end, visited, path, n, m, visitedNodes)) {
            List<String> result = new ArrayList<>();
            for (int node : path) {
                result.add("Node " + node);
            }
            return result;
        }
        return Collections.singletonList("No path found");
    }

    private boolean dfsHelper(int[][] graph, int curr, int end, boolean[] visited, List<Integer> path, int n, int m, List<String> visitedNodes) {
        if (visited[curr]) return false;

        visited[curr] = true;
        visitedNodes.add("Node " + curr);
        path.add(curr);
        if (curr == end) return true;

        int row = curr / m;
        int col = curr % m;
        int[][] directions = { {0, 1}, {1, 0}, {0, -1}, {-1, 0} };

        for (int[] direction : directions) {
            int neighborRow = row + direction[0];
            int neighborCol = col + direction[1];

            if (neighborRow >= 0 && neighborRow < n && neighborCol >= 0 && neighborCol < m) {
                int neighbor = neighborRow * m + neighborCol;
                if (!visited[neighbor] && graph[neighborRow][neighborCol] > 0) {
                    if (dfsHelper(graph, neighbor, end, visited, path, n, m, visitedNodes)) {
                        return true;
                    }
                }
            }
        }

        path.remove(path.size() - 1);
        return false;
    }

    private List<String> reconstructPath(int[] prev, int start, int end) {
        List<Integer> path = new ArrayList<>();
        for (int at = end; at != -1; at = prev[at]) {
            path.add(at);
        }
        Collections.reverse(path);

        if (path.isEmpty() || path.get(0) != start) {
            System.out.println("Path reconstruction failed. No path exists between the start and the end node.");
            return new ArrayList<>();
        }

        List<String> result = new ArrayList<>();
        for (int node : path) {
            result.add("Node " + node);
        }
        return result;
    }
}
