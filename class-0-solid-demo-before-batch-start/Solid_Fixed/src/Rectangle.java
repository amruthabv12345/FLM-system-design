// LSP Fixed - Rectangle only implements Shape2D
// No longer forced to implement getVolume
public class Rectangle implements Shape2D {

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
}