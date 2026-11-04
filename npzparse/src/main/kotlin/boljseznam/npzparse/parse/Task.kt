package si.feri.boljseznam.npzparse.parse

import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import si.feri.boljseznam.npzparse.pdf.Element
import java.awt.geom.Rectangle2D
import kotlin.math.abs
import kotlin.math.max

data class Task(
    val number: Int, val page: Int, val points: Int, private val bounds: Rectangle2D,
    val elements: List<Element>
) {
    companion object {
        private const val SKIP_LEADING_PAGES = 4
        private const val SKIP_TRAILING_PAGES = 2 // docs with an even number of pages have 3 trailing pages

        private val TASK_NUMBER_PATTERN = Regex("\\d+\\.")
        private val TASK_POINTS_PATTERN = Regex("\\((\\d+) točk[aei]?\\)")

        private fun MutableList<Task>.addPageTasks(page: PDPage, pageNumber: Int) {
            val elements = Element.extractAll(page)

            var taskNumber: Element.Text? = null
            var pointsTally = 0
            var lastTaskPoints: Element.Text? = null

            fun addTask(taskNumber: Element.Text) {
                val points = lastTaskPoints
                if (points !is Element.Text) error("Got next task number but no task points")

                val bounds = taskNumber.bounds.createUnion(points.bounds)
                add(
                    Task(
                        number = taskNumber.data.substring(0, taskNumber.data.length - 1).toInt(),
                        page = pageNumber + 1,
                        points = pointsTally,
                        bounds = bounds,
                        elements = elements.filter {
                            bounds.intersects(
                                it.bounds.x,
                                it.bounds.y,
                                max(it.bounds.width, 0.001),
                                max(it.bounds.height, 0.001),
                            )
                        },
                    )
                )
            }

            elements.forEach { element ->
                if (element !is Element.Text) return@forEach

                if (abs(element.x - 70.92f) < 0.001f && element.data.matches(TASK_NUMBER_PATTERN)) {
                    if (taskNumber != null) {
                        if (taskNumber.data == element.data) return@forEach

                        addTask(taskNumber)
                        pointsTally = 0
                        lastTaskPoints = null
                    }

                    taskNumber = element
                    return@forEach
                }

                TASK_POINTS_PATTERN.matchEntire(element.data)?.let { points ->
                    pointsTally += points.groupValues[1].toInt()
                    lastTaskPoints = element
                }
            }

            taskNumber?.let { addTask(it) }
        }

        fun extractAll(pdf: PDDocument) = buildList {
            repeat(pdf.numberOfPages - SKIP_LEADING_PAGES - SKIP_TRAILING_PAGES) { i ->
                val pageNumber = i + SKIP_LEADING_PAGES
                val page = pdf.getPage(pageNumber)
                addPageTasks(page, pageNumber)
            }
        }
    }

    fun toSVG() = buildString {
        append("<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\"")
        append(" viewBox=\"0 0 ${Element.SCALE_X * bounds.width} ${Element.SCALE_Y * bounds.height}\" >\n")

        elements.forEach {
            append("    ")
            append(it.toSVG(bounds.x.toFloat(), (bounds.y + bounds.height).toFloat()))
            append('\n')
        }

        append("</svg>")
    }
}
