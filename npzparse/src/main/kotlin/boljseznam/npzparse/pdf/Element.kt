package si.feri.boljseznam.npzparse.pdf

import org.apache.commons.text.StringEscapeUtils
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.util.Matrix
import org.apache.pdfbox.util.Vector
import java.awt.geom.GeneralPath
import java.awt.geom.PathIterator
import java.awt.geom.Rectangle2D
import java.util.*
import kotlin.math.abs

interface Element {
    companion object {
        const val SCALE_X = 0.85f
        const val SCALE_Y = 1.1f
        const val FONT_SCALE_Y = 0.9f

        private fun toColor(color: Int?) = if (color != null) "#%06x".format(color) else "none"

        fun extractAll(page: PDPage): List<Element> {
            val extractor = PDFElementExtractor(page)
            extractor.processPage(page)

            // merge adjacent text elements
            val elements = buildList(extractor.elements.size) {
                var cur: AppendableText? = null

                extractor.elements.forEach {
                    if (it is Text) {
                        if (cur == null || abs(cur.x2 - it.x) > 0.5f || cur.height != it.height) {
                            cur = AppendableText(it)
                            add(cur)
                        } else {
                            cur.append(it)
                        }
                    } else {
                        add(it)
                    }
                }
            }.mapNotNull { element ->
                if (element is AppendableText) element.toText().takeIf { it.data.isNotEmpty() }
                else element
            }
            return elements
        }
    }

    fun toSVG(offsetX: Float = 0f, originY: Float = 0f): String
    val bounds: Rectangle2D

    data class Text(val x: Float, val y: Float, val width: Float, val height: Float, val data: String) : Element {

        override val bounds = Rectangle2D.Float(x, y - height / 4.5f, width, height)

        constructor(trMatrix: Matrix, displacement: Vector, width: Float, height: Float, data: String) : this(
            trMatrix.translateX, trMatrix.translateY, width, height, data,
        )

        override fun toSVG(offsetX: Float, originY: Float) = buildString {
            append("<text")
            append(" x=\"${SCALE_X * (x - offsetX)}\" y=\"${SCALE_Y * (originY - y)}\"")
            append(" xml:space=\"preserve\"")
            append(" textLength=\"${SCALE_X * width}\" lengthAdjust=\"spacingAndGlyphs\"")
            append(" style=\"font-size: ${SCALE_Y * height * FONT_SCALE_Y}px;\"")
            append(">${StringEscapeUtils.escapeXml11(data)}</text>")
        }
    }

    data class AppendableText(
        val x: Float, val y: Float, var x2: Float, val height: Float, val data: StringBuilder,
    ) : Element {

        val width get() = x2 - x

        constructor(first: Text) : this(
            first.x, first.y, first.x + first.width, first.height, StringBuilder(first.data),
        )

        fun toText() = Text(x, y, width, height, data.trim().toString())

        fun append(next: Text) {
            data.append(next.data)
            x2 = next.x + next.width
        }

        override val bounds: Rectangle2D = toText().bounds
        override fun toSVG(offsetX: Float, originY: Float) = toText().toSVG(offsetX, originY)
    }

    @Suppress("ArrayInDataClass")
    data class Image(override val bounds: Rectangle2D.Float, val image: ByteArray) : Element {
        override fun toSVG(offsetX: Float, originY: Float) = buildString {
            append("<image")
            append(" x=\"${SCALE_X * (bounds.x - offsetX)}\" y=\"${SCALE_Y * (originY - bounds.y - bounds.height)}\"")
            append(" width=\"${SCALE_X * bounds.width}\" height=\"${SCALE_Y * bounds.height}\"")
            append(" href=\"data:image/png;base64,${Base64.getEncoder().encodeToString(image)}\" />")
        }
    }

    data class Rectangle(override val bounds: Rectangle2D.Float, val stroke: Int?, val fill: Int?) : Element {
        override fun toSVG(offsetX: Float, originY: Float) = buildString {
            append("<rect")
            append(" stroke=\"${toColor(stroke)}\"")
            append(" fill=\"${toColor(fill)}\"")
            append(" x=\"${SCALE_X * (bounds.x - offsetX)}\" y=\"${SCALE_Y * (originY - bounds.y - bounds.height)}\"")
            append(" width=\"${SCALE_X * bounds.width}\" height=\"${SCALE_Y * bounds.height}\" />")
        }
    }

    data class Path(private val data: GeneralPath, val stroke: Int?, val fill: Int?) : Element {
        override val bounds get() = data.bounds2D!!

        override fun toSVG(offsetX: Float, originY: Float) = buildString {
            append("<path")
            append(" stroke=\"${toColor(stroke)}\"")
            append(" fill=\"${toColor(fill)}\"")

            append(" d=\"")
            val iter = data.getPathIterator(null)
            val c = FloatArray(6)
            while (!iter.isDone) {
                val type = iter.currentSegment(c)
                repeat(3) { c[it * 2] = SCALE_X * (c[it * 2] - offsetX) }
                repeat(3) { c[it * 2 + 1] = SCALE_Y * (originY - c[it * 2 + 1]) }

                append(
                    when (type) {
                        PathIterator.SEG_MOVETO -> "M${c[0]},${c[1]}"
                        PathIterator.SEG_LINETO -> "L${c[0]},${c[1]}"
                        PathIterator.SEG_QUADTO -> "Q${c[0]},${c[1]},${c[2]},${c[3]}"
                        PathIterator.SEG_CUBICTO -> "C${c[0]},${c[1]},${c[2]},${c[3]},${c[4]},${c[5]}"
                        PathIterator.SEG_CLOSE -> "Z"
                        else -> error("Bad segment type: $type")
                    }
                )
                append(' ')

                iter.next()
            }
            append("\" />")
        }
    }
}
