-- =====================================================================
-- Class 55: indexes on 1 million rows (MySQL 8)
-- Run one block at a time in MySQL Workbench (select it, then Ctrl/Cmd + Enter).
-- Look at the "Duration" column in the Output panel at the bottom to see the time.
--
-- EXPLAIN FORMAT=TRADITIONAL shows the plan as a table with the columns
-- type / key / rows. (Plain EXPLAIN may print a tree instead on newer MySQL.)
-- EXPLAIN ANALYZE always prints a tree, with the actual time taken.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Create a students table and fill it with 1,000,000 rows
-- ---------------------------------------------------------------------
DROP DATABASE IF EXISTS index_demo;
CREATE DATABASE index_demo;
USE index_demo;

CREATE TABLE students (
    id    INT PRIMARY KEY,
    name  VARCHAR(50),
    email VARCHAR(100),
    city  VARCHAR(30),
    age   INT
);

SET SESSION cte_max_recursion_depth = 1000000;

INSERT INTO students (id, name, email, city, age)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000000
)
SELECT n,
       CONCAT('Student ', n),
       CONCAT('student', n, '@mail.com'),
       ELT(1 + n % 5, 'Pune', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata'),
       18 + n % 10
FROM seq;

SELECT COUNT(*) FROM students;          -- 1000000


-- ---------------------------------------------------------------------
-- 2. Search by primary key: already fast, the table IS the id index
-- ---------------------------------------------------------------------
SELECT * FROM students WHERE id = 500000;

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE id = 500000;
-- type = const, key = PRIMARY, rows = 1


-- ---------------------------------------------------------------------
-- 3. Search by email with NO index: full table scan
-- ---------------------------------------------------------------------
SELECT * FROM students WHERE email = 'student500000@mail.com';
-- note the Duration (a few hundred milliseconds)

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE email = 'student500000@mail.com';
-- type = ALL  (full table scan)
-- key  = NULL (no index used)
-- rows = ~1000000 (rows MySQL expects to check)

EXPLAIN ANALYZE SELECT * FROM students WHERE email = 'student500000@mail.com';
-- shows "Table scan on students" and the actual time taken


-- ---------------------------------------------------------------------
-- 4. Create the index, then run the SAME query again
-- ---------------------------------------------------------------------
CREATE INDEX idx_email ON students(email);
-- takes a few seconds: MySQL reads all 1M rows and builds a new B+ tree

SELECT * FROM students WHERE email = 'student500000@mail.com';
-- Duration is now close to 0

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE email = 'student500000@mail.com';
-- type = ref, key = idx_email, rows = 1

EXPLAIN ANALYZE SELECT * FROM students WHERE email = 'student500000@mail.com';
-- shows "Index lookup on students using idx_email"


-- ---------------------------------------------------------------------
-- 5. Bonus: when the index CANNOT be used
-- ---------------------------------------------------------------------
EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE email LIKE 'student500000%';
-- starts with a fixed prefix: uses idx_email (type = range)

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE email LIKE '%500000@mail.com';
-- starts with %: type = ALL, full table scan even though idx_email exists


-- ---------------------------------------------------------------------
-- 6. Bonus: composite index and the leftmost rule
-- ---------------------------------------------------------------------
CREATE INDEX idx_city_age ON students(city, age);

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE city = 'Pune' AND age = 20;
-- key = idx_city_age

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE age = 20 AND city = 'Pune';
-- same plan: the order inside WHERE does not matter

EXPLAIN FORMAT=TRADITIONAL SELECT * FROM students WHERE age = 20;
-- key = NULL: age is not the first column of the index, so it cannot be used


-- ---------------------------------------------------------------------
-- 7. See all indexes on the table, then clean up
-- ---------------------------------------------------------------------
SHOW INDEX FROM students;

-- DROP DATABASE index_demo;
