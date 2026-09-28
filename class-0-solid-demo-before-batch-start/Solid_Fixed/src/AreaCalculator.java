import java.util.List;

// DIP Fixed - AreaCalculator receives Shape2D objects from outside
// It does not create its own dependencies
// LSP Fixed - No instanceof checks anywhere
// We trust every Shape2D to honour the getArea contract
public class AreaCalculator {

    private List<Shape2D> shapes;

    // DIP Fixed - Dependencies are injected through constructor
    public AreaCalculator(List<Shape2D> shapes) {
        this.shapes = shapes;
    }

    public double calculateTotalArea() {
        double total = 0;
        for (Shape2D shape : shapes) {
            // No instanceof check needed - every Shape2D honours the contract
            total += shape.getArea();
        }
        return total;
    }
}