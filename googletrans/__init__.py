class Translator:
    def translate(self, text, src='fr', dest='en'):
        return type('Obj', (), {'text': text})
