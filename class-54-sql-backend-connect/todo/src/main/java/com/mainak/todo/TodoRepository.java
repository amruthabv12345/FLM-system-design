package com.mainak.todo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {


    // ---------- @Query: plain MySQL, same as in Workbench ----------



    // ---------- Derived methods ----------
    // BREAKPOINT HINT: in IntelliJ press Shift+Shift, tick "Include non-project items",
    // open "PartTree" (org.springframework.data.repository.query.parser.PartTree),
    // put a breakpoint in its constructor and start the app in Debug mode.
    // It stops once per method below AT STARTUP -> look at the "source" variable
    // to see the method name being parsed.

    List<Todo> findByTitle(String title);                                   // WHERE title = ?

    List<Todo> findByTitleContaining(String text);                          // WHERE title LIKE %?%

    List<Todo> findByTitleStartingWith(String prefix);                      // WHERE title LIKE ?%

    List<Todo> findByCompleted(boolean completed);                          // WHERE completed = ?

    List<Todo> findByPriorityGreaterThan(int priority);                     // WHERE priority > ?

    List<Todo> findByPriorityBetween(int min, int max);                     // WHERE priority BETWEEN ? AND ?

    List<Todo> findByCompletedAndPriority(boolean completed, int priority); // WHERE completed = ? AND priority = ?

    List<Todo> findByCompletedOrderByPriorityDesc(boolean completed);       // WHERE completed = ? ORDER BY priority DESC

    long countByCompleted(boolean completed);                               // SELECT COUNT(*) ... WHERE completed = ?

    boolean existsByTitle(String title);                                    // true / false

    @Query(value = "SELECT * FROM my_todo WHERE completed = false", nativeQuery = true)
    List<Todo> getPendingTodos();

    @Query(value = "SELECT * FROM my_todo WHERE priority >= :priority ORDER BY priority DESC", nativeQuery = true)
    List<Todo> getHighPriorityTodos(@Param("priority") int priority);

    @Modifying
    @Transactional
    @Query(value = "UPDATE my_todo SET completed = true WHERE id = :id", nativeQuery = true)
    int markCompleted(@Param("id") Long id);
}
