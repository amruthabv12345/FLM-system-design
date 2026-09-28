// Strongest LSP Violation - Line has neither area nor volume
public class Line implements Shape {

    private double length;

    public Line(double length) {
        this.length = length;
    }

    @Override
    public double getArea() {
        // LSP Violation - Line is a 1D shape, it has no area
        throw new UnsupportedOperationException("Line does not have an area");
    }

    @Override
    public double getVolume() {
        // LSP Violation - Line is a 1D shape, it has no volume
        throw new UnsupportedOperationException("Line does not have a volume");
    }
}