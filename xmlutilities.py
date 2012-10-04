def setDoctype(document, doctype):
    imp = document.implementation
    newdocument = imp.createDocument(doctype.namespaceURI, doctype.name, doctype)
    newdocument.version = document.version
    refel= newdocument.documentElement
    for child in document.childNodes:
        if child.nodeType==child.ELEMENT_NODE:
            newdocument.replaceChild(
                newdocument.importNode(child, True), newdocument.documentElement
            )
            refel= None
        elif child.nodeType!=child.DOCUMENT_TYPE_NODE:
            newdocument.insertBefore(newdocument.importNode(child, True), refel)
    return newdocument
