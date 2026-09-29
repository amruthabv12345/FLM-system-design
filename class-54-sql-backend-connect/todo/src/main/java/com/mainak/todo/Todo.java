package com.mainak.todo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "my_todo")
@Getter
@Setter
@NoArgsConstructor
public class Todo {

    @Id
    private Long id;
    private String title;
    private boolean completed;
    private int priority;
}
