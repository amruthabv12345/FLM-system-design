import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);
        ShapeCalculator calculator = new ShapeCalculator();

        while (true) {
            System.out.println("\nWhat do you want to calculate?");
            System.out.println("1. Area");
            System.out.println("2. Volume");
            System.out.println("3. Exit");
            System.out.print("Enter choice: ");
            int choice = scanner.nextInt();

            if (choice == 3) {
                System.out.println("Goodbye!");
                break;
            }

            if (choice == 1) {
                System.out.println("Enter shape (circle / rectangle / triangle): ");
                String shape = scanner.next();

                System.out.print("Enter dimension 1: ");
                double d1 = scanner.nextDouble();

                System.out.print("Enter dimension 2 (enter 0 if not needed): ");
                double d2 = scanner.nextDouble();

                double area = calculator.calculateArea(shape, d1, d2);
                System.out.println("Area: " + area);

            } else if (choice == 2) {
                System.out.println("Enter shape (sphere / cube): ");
                String shape = scanner.next();

                System.out.print("Enter dimension: ");
                double d1 = scanner.nextDouble();

                double volume = calculator.calculateVolume(shape, d1);
                System.out.println("Volume: " + volume);
            }
        }

        scanner.close();
    }
}