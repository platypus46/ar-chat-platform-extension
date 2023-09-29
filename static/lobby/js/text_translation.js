function getLocalizedText(key, variables = {}) {
    const translations = {
        "Length: Calculating...": {
            "en": "Length: Calculating...",
            "ko-kr": "길이: 계산 중..."
        },
        "Length: Initialized": {
            "en": "Length: Initialized",
            "ko-kr": "길이: 초기화"
        },
        "Length: Value": {
            "en": `Length: ${variables.length} cm`,
            "ko-kr": `길이: ${variables.length} cm`
        },
    };
    
    return translations[key][currentLanguage];
}