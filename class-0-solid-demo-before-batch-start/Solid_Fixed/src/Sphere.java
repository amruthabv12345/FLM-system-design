// LSP Fixed - Sphere only implements Shape3D
// No longer forced to implement getArea in a 2D context
public class Sphere implements Shape3D {

    private double radius;

    public Sphere(double radius) {
        this.radius = radius;
    }

    @Override
    public double getVolume() {
        return (4.0 / 3.0) * Math.PI * radius * radius * radius;
    }
}