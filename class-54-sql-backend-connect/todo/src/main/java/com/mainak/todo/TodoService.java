package com.mainak.todo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;


    // ---------- Built-in methods ----------
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    public Todo addTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    public Todo updateTodo(Long id, Todo todo) {
        todo.setId(id);
        return todoRepository.save(todo);
    }

    public void deleteTodo(Long id) {
        todoRepository.deleteById(id);
    }

    // ---------- @Query (native) ----------
    public List<Todo> getPendingTodos() {
        return todoRepository.getPendingTodos();
    }

    public List<Todo> getHighPriorityTodos(int priority) {
        return todoRepository.getHighPriorityTodos(priority);
    }

    public int markCompleted(Long id) {
        return todoRepository.markCompleted(id);
    }

    // ---------- Derived methods ----------
    public List<Todo> getByTitle(String title) {
        return todoRepository.findByTitle(title);
    }

    public List<Todo> getByTitleContaining(String text) {
        return todoRepository.findByTitleContaining(text);
    }

    public List<Todo> getByTitleStartingWith(String prefix) {
        return todoRepository.findByTitleStartingWith(prefix);
    }

    public List<Todo> getByCompleted(boolean completed) {
        return todoRepository.findByCompleted(completed);
    }

    public List<Todo> getByPriorityAbove(int priority) {
        return todoRepository.findByPriorityGreaterThan(priority);
    }

    public List<Todo> getByPriorityBetween(int min, int max) {
        return todoRepository.findByPriorityBetween(min, max);
    }

    public List<Todo> getByCompletedAndPriority(boolean completed, int priority) {
        return todoRepository.findByCompletedAndPriority(completed, priority);
    }

    public List<Todo> getByCompletedSortedByPriority(boolean completed) {
        return todoRepository.findByCompletedOrderByPriorityDesc(completed);
    }


    public long countByCompleted(boolean completed) {
        return todoRepository.countByCompleted(completed);
    }

    public boolean existsByTitle(String title) {
        return todoRepository.existsByTitle(title);
    }
}
