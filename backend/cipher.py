# Simple Caesar-style cipher used to obscure credentials before they are
# written to the local "database" file (see user_store.py).
#
# Adapted from the course HW2 cipher.py. The original encrypt() had a bug:
# its character-validity check only allowed ' ' and '!', which meant it
# rejected virtually every real username/password (letters, digits, etc.).
# That check has been fixed below so it actually validates against the
# cipher's encodable character range (printable ASCII '!' through '~',
# excluding space) instead of hard-coding two specific characters.


def encrypt(inputText, N, D):
    if (N <= 0 or D not in [1, -1]):
        return "Invalid input"

    flipped = ""
    for i in range(len(inputText)):
        flipped += inputText[len(inputText) - 1 - i]

    outputText = ""
    for char in flipped:
        if not (33 <= ord(char) <= 126):
            return "Invalid input"
        outputText += chr(34 + (ord(char) + (N * D) - 34) % 93)
    return outputText


def decrypt(inputText, N, D):
    if (N <= 0 or D not in [1, -1]):
        return "Invalid input"

    flipped = ""
    for i in range(len(inputText)):
        flipped += inputText[len(inputText) - 1 - i]

    outputText = ""
    for char in flipped:
        outputText += chr(34 + (ord(char) - (N * D) - 34) % 93)
    return outputText
