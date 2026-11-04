package si.feri.boljseznam.npzparse.parse

import org.apache.pdfbox.pdmodel.PDDocument

data class Answer(val task: String, val answer: String) {

    companion object {
        fun extractAll(pdf: PDDocument): List<Answer> {
            return AnswerTable.extractAll(pdf).flatMap { table ->
                val answersColumn = table.columnNames.indexOfFirst { it.startsWith("Odgovor") }
                table.rows.mapNotNull { row ->
                    row[answersColumn]?.let { answer ->
                        Answer(row[0]!!, answer)
                    }
                }
            }
        }
    }

}
