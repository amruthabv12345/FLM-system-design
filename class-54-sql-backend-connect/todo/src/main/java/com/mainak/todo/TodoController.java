package com.mainak.todo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TodoController {

    @Autowired
    private TodoService todoService;

    // ---------- The four main APIs ----------

    @GetMapping("/todos")
    public List<Todo> getTodos() {
        return todoService.getAllTodos();
    }

    @PostMapping("/todos")
    public Todo addTodo(@RequestBody Todo todo) {
        return todoService.addTodo(todo);
    }

    @PutMapping("/todos/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        return todoService.updateTodo(id, todo);
    }

    @DeleteMapping("/todos/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
    }

    // ---------- @Query (native) ----------

    // GET /todos/pending
    @GetMapping("/todos/pending")
    public List<Todo> getPendingTodos() {
        return todoService.getPendingTodos();
    }

    // GET /todos/high-priority?priority=3
    @GetMapping("/todos/high-priority")
    public List<Todo> getHighPriorityTodos(@RequestParam int priority) {
        return todoService.getHighPriorityTodos(priority);
    }

    // PUT /todos/1/complete
    @PutMapping("/todos/{id}/complete")
    public int markCompleted(@PathVariable Long id) {
        return todoService.markCompleted(id);
    }

    // ---------- Derived methods ----------

    // GET /todos/by-title?title=Buy milk
    @GetMapping("/todos/by-title")
    public List<Todo> getByTitle(@RequestParam String title) {
        return todoService.getByTitle(title);
    }

    // GET /todos/contains?text=milk
    @GetMapping("/todos/contains")
    public List<Todo> getByTitleContaining(@RequestParam String text) {
        return todoService.getByTitleContaining(text);
    }

    // GET /todos/starts-with?prefix=Buy
    @GetMapping("/todos/starts-with")
    public List<Todo> getByTitleStartingWith(@RequestParam String prefix) {
        return todoService.getByTitleStartingWith(prefix);
    }

    // GET /todos/completed?completed=true
    @GetMapping("/todos/completed")
    public List<Todo> getByCompleted(@RequestParam boolean completed) {
        return todoService.getByCompleted(completed);
    }

    // GET /todos/priority-above?priority=2
    @GetMapping("/todos/priority-above")
    public List<Todo> getByPriorityAbove(@RequestParam int priority) {
        return todoService.getByPriorityAbove(priority);
    }

    // GET /todos/priority-between?min=1&max=3
    @GetMapping("/todos/priority-between")
    public List<Todo> getByPriorityBetween(@RequestParam int min, @RequestParam int max) {
        return todoService.getByPriorityBetween(min, max);
    }

    // GET /todos/filter?completed=false&priority=2
    @GetMapping("/todos/filter")
    public List<Todo> getByCompletedAndPriority(@RequestParam boolean completed, @RequestParam int priority) {
        return todoService.getByCompletedAndPriority(completed, priority);
    }

    // GET /todos/sorted?completed=false
    @GetMapping("/todos/sorted")
    public List<Todo> getByCompletedSortedByPriority(@RequestParam boolean completed) {
        return todoService.getByCompletedSortedByPriority(completed);
    }

    // GET /todos/count?completed=true
    @GetMapping("/todos/count")
    public long countByCompleted(@RequestParam boolean completed) {
        return todoService.countByCompleted(completed);
    }

    // GET /todos/exists?title=Buy milk
    @GetMapping("/todos/exists")
    public boolean existsByTitle(@RequestParam String title) {
        return todoService.existsByTitle(title);
    }
}
