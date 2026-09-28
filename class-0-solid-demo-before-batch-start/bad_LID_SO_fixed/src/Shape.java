// BAD CODE - ISP Violation
// This is a fat interface forcing 2D shapes to implement getVolume
// and 3D shapes to implement getArea in a 2D context

public interface Shape {
    double getArea();
    double getVolume(); // ISP Violation - 2D shapes should never have to implement this
}