import java.util.ArrayList;
import java.util.List;

// BAD CODE - Violates DIP and LSP
public class AreaCalculator {

    private final List<Shape> shapes;

    public AreaCalculator() {
        // DIP Violation - AreaCalculator is creating its own dependencies
        // It should receive shapes from outside, not create them itself
        shapes = new ArrayList<>();
        shapes.add(new Circle(10)); // 314
        shapes.add(new Rectangle(4, 6)); // 24
        shapes.add(new Line(3));

    }

    public double calculateTotalArea() {
        double total = 0;
        for (Shape shape : shapes) {

            // LSP Violation - If LSP was honoured, we should never need instanceof
            // The fact that we are checking for Line means Line broke the contract
            // and we are doing defensive coding around it
            if (shape instanceof Line) {
                System.out.println("Skipping Line - it has no area");
                continue;
            }

            total += shape.getArea(); // runtime polymorphism
        }
        return total;
    }
}