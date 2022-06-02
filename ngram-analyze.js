function analyze_text() {
    text = $('#input-text').val().split('\n')
    $('#output-text').children().remove()
    for (let t in text) {
        // ignore white space
        if (text[t]) {
            $('#output-text').append('<p>' + text[t] + '</p>')
        }
    }
}
