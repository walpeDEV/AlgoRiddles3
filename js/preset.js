const colorTheme = {
    mode: null,
    colors: {
        'dark': {
            prime: '#dadada',
            secondary: '#666666',
            background: '#1b2431'
        },
        '': {
            prime: '#1b2431',
            secondary: '#ffffff',
            background: '#d4d4d4',
        }
    },
    update: function() {
        const darkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        colorTheme.mode = document.body.dataset.theme = darkmode?'dark':'';
    }
};
colorTheme.update();