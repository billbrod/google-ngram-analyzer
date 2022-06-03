function create_background_rects(data) {
    console.log(data)
    tgt_year = $('#target-year').val()
    years = d3.range(1500, 2020)
    tgt_idx = years.indexOf(Number(tgt_year))
    color = i => d3.interpolateReds(d3.scaleLinear().domain([0, d3.max(data.map(d => d.timeseries[tgt_idx]))]).range([1, 0])(i)).replace(')', ', .8)')
    console.log(tgt_year, tgt_idx)
    console.log(d3.max(data.map(d => d.timeseries[tgt_idx])))
    console.log(data.map(d => [d.ngram, d.timeseries[tgt_idx]]))
    data.map(d => d3.select(`#${d.ngram}`).attr('style', `background-color:${color(d.timeseries[tgt_idx])}`))
}

function analyze_text() {
    text = $('#input-text').val()
    // break into words, see https://stackoverflow.com/a/36508315
    words = text.match(/\b(\w+)'?(\w+)?\b/g)
    words = words.join(',')
    ngram_url = `https://books.google.com/ngrams/json?content=${words}&year_start=1500&year_end=2019&corpus=26&smoothing=3`
    $.ajax({url: ngram_url, type: 'GET', dataType: 'jsonp'}).then(d => create_background_rects(d))
    // get all non-white space text
    paragraphs = text.split('\n').filter(t => t.trim() != '')
    $('#output-text').children().remove()
    for (let t in paragraphs) {
        $('#output-text').append('<p>' + paragraphs[t].match(/\b(\w+)'?(\w+)?\b/g).map(word => `<span id=${word}>${word}</span>`).join(' ') + '</p>')
    }
}
