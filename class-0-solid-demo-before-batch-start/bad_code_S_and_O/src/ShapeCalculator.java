// BAD CODE - Violates SRP and OCP

public class ShapeCalculator {

    // SRP Violation - This class is doing two jobs
    // Job 1 - Calculating Area
    // OCP Violation - Every time a new shape is added, we have to open this method and add a new else if
    public double calculateArea(String shape, double dimension1, double dimension2) {
        if (shape.equals("circle")) {
            return Math.PI * dimension1 * dimension1;
        } else if (shape.equals("rectangle")) {
            return dimension1 * dimension2;
        } else if (shape.equals("triangle")) {
            return 0.5 * dimension1 * dimension2;
        }
        else if(shape.equals("square")){
            return dimension1 * dimension1;
        }
        else if (shape.equals("trapezium")){
            // return 0.5 * (d1 + d2)* d3
        }

        return 0;
    }

    // SRP Violation - This class is doing two jobs
    // Job 2 - Calculating Volume
    // OCP Violation - Every time a new shape is added, we have to open this method and add a new else if
    public double calculateVolume(String shape, double dimension1) {
        if (shape.equals("sphere")) {
            return (4.0 / 3.0) * Math.PI * dimension1 * dimension1 * dimension1;
        } else if (shape.equals("cube")) {
            return dimension1 * dimension1 * dimension1;
        }
        return 0;
    }
}
