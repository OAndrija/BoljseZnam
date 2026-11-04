package si.feri.boljseznam.npzparse

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.apache.pdfbox.Loader
import si.feri.boljseznam.npzparse.parse.Answer
import si.feri.boljseznam.npzparse.parse.Task
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name

private val JSON = Json {
    encodeDefaults = true
    prettyPrint = true
}

@Serializable
private data class Problem(
    val subject: String = "KEM",
    val year: Int,
    val id: Int,
    val categories: List<String> = emptyList(),
    val prompt: String = "",
    val resources: List<String> = emptyList(),
    val questions: List<Question>,
)

@Serializable
private data class Question(
    val type: String = "essay",
    val prompt: String = "",
    val resources: List<String>,
    val answer: String?,
)

private fun getAnswerMap(): Map<String, List<Answer>> {
    val input = Path.of("data/input/npz-answers").also { it.createDirectories() }
    return buildMap {
        input.listDirectoryEntries("N*.pdf").forEach { file ->
            put(file.name.substring(1, 4), Loader.loadPDF(file.toFile()).use { Answer.extractAll(it) })
        }
    }
}

fun main() {
    val answerMap = getAnswerMap()
    println("Built answer map")

    val input = Path.of("data/input/npz-tasks")

    val output = Path.of("../data").also { it.createDirectories() }
    output.resolve("resources").createDirectories()
    output.resolve("problems").createDirectories()


    input.listDirectoryEntries("N*.pdf").forEach { file ->
        Loader.loadPDF(file.toFile()).use { pdf ->
            val year = 2000 + file.name.substring(1, 3).toInt()

            val tasks = Task.extractAll(pdf)
            println("Extracted ${tasks.size} tasks from $file")

            val answers = answerMap[file.name.substring(1, 4)] ?: emptyList()

            tasks.forEach { task ->
                val name = "KEM-$year-${"%02d".format(task.number)}"
                Files.writeString(output.resolve("resources").resolve("$name.svg"), task.toSVG())

                val taskAnswers = answers.filter {
                    listOf(task.number.toString(), "%02d".format(task.number)).any { id ->
                        it.task == id || it.task.startsWith("${id}.")
                    }
                }

                Files.writeString(
                    output.resolve("problems").resolve("$name.json"), JSON.encodeToString(
                        Problem(
                            year = year,
                            id = task.number,
                            questions = listOf(
                                Question(
                                    resources = listOf("$name.svg"),
                                    answer = when (taskAnswers.size) {
                                        0 -> null
                                        1 -> taskAnswers.first().answer
                                        else -> taskAnswers.joinToString("\n") { "${it.task} - ${it.answer}" }
                                    },
                                )
                            ),
                        )))
            }
        }
    }
}
