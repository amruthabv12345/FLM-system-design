import java.util.List;

// DIP Fixed - VolumeCalculator receives Shape3D objects from outside
// It does not create its own dependencies
public class VolumeCalculator {

    private List<Shape3D> shapes;

    // DIP Fixed - Dependencies are injected through constructor
    public VolumeCalculator(List<Shape3D> shapes) {
        this.shapes = shapes;
    }

    public double calculateTotalVolume() {
        double total = 0;
        for (Shape3D shape : shapes) {
            total += shape.getVolume();
        }
        return total;
    }
}