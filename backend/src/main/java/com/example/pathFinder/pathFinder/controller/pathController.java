package com.example.pathFinder.pathFinder.controller;

import com.example.pathFinder.pathFinder.service.pathFinderService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "${frontend.origin}")
@RestController
@RequestMapping("/api/pathfinder")

public class pathController {
    private final pathFinderService pathFinderService = new pathFinderService();

    @PostMapping("/find")
    public Map<String,List<String>> findPath(@RequestBody Map<String, Object> requestData) {
        String algorithm = (String) requestData.get("algorithm");
        int start = (int) requestData.get("start");
        int end = (int) requestData.get("end");
        List<List<Integer>> graphList = (List<List<Integer>>) requestData.get("graph");
    
        int n = graphList.size();
        int[][] graph = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                graph[i][j] = graphList.get(i).get(j);
            }
        }
    
        System.out.println("Algorithm: " + algorithm);
        System.out.println("Graph: " + Arrays.deepToString(graph));
        System.out.println("Start Node: " + start);
        System.out.println("End Node: " + end);
        
        if(start<0 || start >= graph.length * graph.length || end<0 || end>=graph.length*graph.length){
            throw new IllegalArgumentException("Start or end node is out of bounds");
        }
        
        int startRow = start/graph[0].length;
        int startCol = start%graph[0].length;
        int endRow = end/graph[0].length;
        int endCol = end%graph[0].length;

        System.out.println("Mapped start Node: Row = " + startRow + ", Column = " + startCol);
        System.out.println("Mapped end Node: Row = " + endRow + ", Column = " + endCol);

        if (graph.length == 0 || graph[0].length != graph.length) {
            throw new IllegalArgumentException("Invalid graph dimensions");
        }
    
        return pathFinderService.findPath(algorithm, graph, start, end);
    }
    
}
