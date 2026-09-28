// LSP Fixed - Circle only implements Shape2D
// No longer forced to implement getVolume
public class Circle implements Shape2D {

    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }
}