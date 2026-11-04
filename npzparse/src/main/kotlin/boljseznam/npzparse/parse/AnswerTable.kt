package si.feri.boljseznam.npzparse.parse

import org.apache.pdfbox.pdmodel.PDDocument
import si.feri.boljseznam.npzparse.pdf.Element
import kotlin.math.abs

data class AnswerTable(val columnNames: List<String>, val rows: List<List<String?>>) {
    companion object {
        fun extractAll(pdf: PDDocument) = buildList {
            repeat(pdf.numberOfPages) { i ->
                val elements = Element.extractAll(pdf.getPage(i)).filterIsInstance<Element.Text>()

                val columnsHeaders = ArrayList<Element.Text>()
                val rows = ArrayList<List<Element.Text>>()
                val row = ArrayList<Element.Text>()

                fun saveTable() {
                    if (columnsHeaders.isNotEmpty()) {
                        if (row.isNotEmpty()) rows.add(ArrayList(row))
                        add(createTable(columnsHeaders, rows))

                        columnsHeaders.clear()
                        rows.clear()
                        row.clear()
                    }
                }

                elements.forEach {
                    if (it.data == "Naloga") {
                        saveTable()
                        columnsHeaders.add(it)
                        return@forEach
                    }

                    if (columnsHeaders.isEmpty()) return@forEach

                    if (abs(columnsHeaders.first().y - it.y) < 0.5f) {
                        columnsHeaders.add(it)
                        return@forEach
                    }

                    if (it.x < columnsHeaders.first().x) {
                        saveTable()
                        return@forEach
                    } else if (it.x < columnsHeaders[1].x) {
                        if (row.isNotEmpty()) rows.add(ArrayList(row))
                        row.clear()
                    }

                    row.add(it)
                }

                saveTable()
            }
        }

        private fun createTable(columnsHeaders: List<Element.Text>, rows: List<List<Element.Text>>): AnswerTable {
            val textRows = rows.map { row ->
                columnsHeaders.mapIndexed { i, column ->
                    var lastY = Float.POSITIVE_INFINITY
                    val data = StringBuilder()

                    row.forEach {
                        if (it.x < column.x) return@forEach
                        if (i < columnsHeaders.size - 1 && it.x >= columnsHeaders[i + 1].x) return@forEach

                        if (abs(lastY - it.y) > 5) {
                            data.append('\n')
                            lastY = it.y
                        } else if (data.isNotEmpty()) {
                            data.append(' ')
                        }
                        data.append(it.data.replace("\uF0BF", "•"))
                    }

                    data.trim().takeIf { it.isNotEmpty() }?.toString()
                }
            }.filter { it[0] != "Skupaj" }

            return AnswerTable(columnsHeaders.map { it.data }, textRows)
        }
    }
}
