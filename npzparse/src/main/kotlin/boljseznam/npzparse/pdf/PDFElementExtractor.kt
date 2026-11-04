package si.feri.boljseznam.npzparse.pdf

import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine
import org.apache.pdfbox.cos.COSName
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.font.PDFont
import org.apache.pdfbox.pdmodel.graphics.color.PDPattern
import org.apache.pdfbox.pdmodel.graphics.image.PDImage
import org.apache.pdfbox.util.Matrix
import org.apache.pdfbox.util.Vector
import java.awt.Color
import java.awt.geom.GeneralPath
import java.awt.geom.Point2D
import java.awt.geom.Rectangle2D
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import kotlin.math.abs

class PDFElementExtractor(page: PDPage, val elements: MutableList<Element> = ArrayList()) :
    PDFGraphicsStreamEngine(page) {

    private val linePath = GeneralPath()
    private lateinit var lastRectangle: Rectangle2D.Float
    private var isRectangle: Boolean? = null

    override fun appendRectangle(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D) {
        linePath.moveTo(p0.x.toFloat(), p0.y.toFloat())
        linePath.lineTo(p1.x.toFloat(), p1.y.toFloat())
        linePath.lineTo(p2.x.toFloat(), p2.y.toFloat())
        linePath.lineTo(p3.x.toFloat(), p3.y.toFloat())

        val points = arrayOf(p0, p1, p2, p3)
        lastRectangle = Rectangle2D.Float(
            points.minOf { it.x }.toFloat(),
            points.minOf { it.y }.toFloat(),
            (points.maxOf { it.x } - points.minOf { it.x }).toFloat(),
            (points.maxOf { it.y } - points.minOf { it.y }).toFloat(),
        )
        isRectangle = isRectangle == null

        linePath.closePath()
    }

    override fun drawImage(pdImage: PDImage) {
        val ctm = graphicsState.currentTransformationMatrix.clone()

        var image = pdImage.image
        if (ctm.scaleY < 0) {
            ctm.setValue(1, 1, ctm.scaleY * -1)
            ctm.setValue(2, 1, ctm.translateY - ctm.scaleY)
            val newImage = BufferedImage(image.width, image.height, image.type)
            val g2d = newImage.createGraphics()
            g2d.drawImage(image, 0, image.height, image.width, -image.height, null)
            g2d.dispose()
            image = newImage
        }

        val data = ByteArrayOutputStream().apply { ImageIO.write(image, "png", this) }.toByteArray()

        elements.add(
            Element.Image(
                Rectangle2D.Float(
                    ctm.translateX,
                    ctm.translateY,
                    ctm.scaleX,
                    ctm.scaleY,
                ), data
            )
        )
    }

    override fun showGlyph(textRenderingMatrix: Matrix, font: PDFont, code: Int, displacement: Vector) {
        if (font.isVertical || abs(textRenderingMatrix.shearY) > 0.001) return // ignore vertical text

        val textState = graphicsState.textState
        var width = displacement.x * textState.fontSize + textState.characterSpacing + textState.wordSpacing
        width *= textRenderingMatrix.scaleX * textState.horizontalScaling / 100f

        elements.add(
            Element.Text(textRenderingMatrix, displacement, width, textRenderingMatrix.scaleY, font.toUnicode(code))
        )
    }

    private fun addPath(stroke: Boolean = false, fill: Boolean = false) {
        val state = graphicsState
        val strokeColor = if (stroke) state.strokingColor.toRGB() else null
        val fillColor = if (fill) {
            if (state.nonStrokingColorSpace is PDPattern) Color.GRAY.rgb
            else state.nonStrokingColor.toRGB()
        } else null

        if (isRectangle == true) elements.add(Element.Rectangle(lastRectangle, strokeColor, fillColor))
        else elements.add(Element.Path(linePath.clone() as GeneralPath, strokeColor, fillColor))
        linePath.reset()
        isRectangle = null
    }

    override fun strokePath() {
        addPath(stroke = true)
    }

    override fun fillPath(windingRule: Int) {
        addPath(fill = true)
    }

    override fun fillAndStrokePath(windingRule: Int) {
        addPath(stroke = true, fill = true)
    }

    override fun moveTo(x: Float, y: Float) {
        this.linePath.moveTo(x, y)
    }

    override fun lineTo(x: Float, y: Float) {
        this.linePath.lineTo(x, y)
        isRectangle = false
    }

    override fun curveTo(x1: Float, y1: Float, x2: Float, y2: Float, x3: Float, y3: Float) {
        this.linePath.curveTo(x1, y1, x2, y2, x3, y3)
        isRectangle = false
    }

    override fun getCurrentPoint(): Point2D? {
        return this.linePath.getCurrentPoint()
    }

    override fun closePath() {
        this.linePath.closePath()
    }

    override fun endPath() {
        this.linePath.reset()
    }

    override fun clip(windingRule: Int) = Unit
    override fun shadingFill(shadingName: COSName?) = Unit

}
