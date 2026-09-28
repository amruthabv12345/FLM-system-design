import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.println("\nWhat do you want to do?");
            System.out.println("1. Calculate Total Area");
            System.out.println("2. Exit");
            System.out.print("Enter choice: ");
            int choice = scanner.nextInt();

            if (choice == 2) {
                System.out.println("Goodbye!");
                break;
            }

            if (choice == 1) {
                AreaCalculator calculator = new AreaCalculator();
                double totalArea = calculator.calculateTotalArea();
                System.out.println("Total Area: " + totalArea);
            }
        }

        scanner.close();
    }
}