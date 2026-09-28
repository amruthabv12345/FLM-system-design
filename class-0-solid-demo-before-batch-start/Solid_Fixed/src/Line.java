// LSP Fixed - Line only implements Shape1D
// No longer forced to implement getArea or getVolume
public class Line implements Shape1D {

    private double length;

    public Line(double length) {
        this.length = length;
    }

    @Override
    public double getLength() {
        return length;
    }
}