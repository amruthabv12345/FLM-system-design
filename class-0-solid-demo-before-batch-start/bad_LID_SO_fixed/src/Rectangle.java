// LSP Violation - Rectangle cannot honour the full Shape contract
public class Rectangle implements Shape {

    private double length;
    private double breadth;

    public Rectangle(double length, double breadth) {
        this.length = length;
        this.breadth = breadth;
    }

    @Override
    public double getArea() {
        return length * breadth;
    }

    @Override
    public double getVolume() {
        // LSP Violation - Rectangle is a 2D shape, it has no volume
        // But the fat interface forces us to implement this
        throw new UnsupportedOperationException("Rectangle does not have a volume");
    }
}