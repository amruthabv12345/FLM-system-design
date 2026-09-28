public class Square implements Shape2D{

    double side;

    public Square(double length) {
        this.side = length;

    }
    @Override
    public double getArea() {
        return side*side;
    }
}
