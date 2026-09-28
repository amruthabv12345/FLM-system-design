// LSP Violation - Circle cannot honour the full Shape contract
public class Circle implements Shape {

    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }

    @Override
    public double getVolume() {
        // LSP Violation - Circle is a 2D shape, it has no volume
        // But the fat interface forces us to implement this
        throw new UnsupportedOperationException("Circle does not have a volume");
    }
}