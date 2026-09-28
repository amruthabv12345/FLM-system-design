import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Scanner;

public class Main {


    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        // Creating 2D shapes
        List<Shape2D> shapes2D = new LinkedList<>();
        shapes2D.add(new Circle(5));
        shapes2D.add(new Rectangle(4, 6));
        shapes2D.add(new Square(4));


        // Creating 3D shapes
        List<Shape3D> shapes3D = new ArrayList<>();
        shapes3D.add(new Sphere(3));

        // Injecting dependencies from outside
        AreaCalculator areaCalculator = new AreaCalculator(shapes2D);
        VolumeCalculator volumeCalculator = new VolumeCalculator(shapes3D);

        while (true) {
            System.out.println("\nWhat do you want to calculate?");
            System.out.println("1. Total Area of 2D Shapes");
            System.out.println("2. Total Volume of 3D Shapes");
            System.out.println("3. Exit");
            System.out.print("Enter choice: ");
            int choice = scanner.nextInt();

            if (choice == 3) {
                System.out.println("Goodbye!");
                break;
            }

            if (choice == 1) {
                double totalArea = areaCalculator.calculateTotalArea();
                System.out.println("Total Area: " + totalArea);
            } else if (choice == 2) {
                double totalVolume = volumeCalculator.calculateTotalVolume();
                System.out.println("Total Volume: " + totalVolume);
            }
        }

        scanner.close();
    }
}