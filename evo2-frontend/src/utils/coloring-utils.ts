
export function getNucleotideColorClass(nucleotide: string): string {
    switch (nucleotide.toUpperCase()) {
        case "A":
            return "text-red-600"
        case "T":
            return "text-blue-600"
        case "G":
            return "text-green-600"
        case "C":
            return "text-amber-600"
        default:
            return "text-gray-500"
    }
}

export function getClassificationColorClasses(classification: string): string {
    if (!classification) return "bg-yellow-100 text-yellow-800"
    const lowercaseClass = classification.toLowerCase()

    if (lowercaseClass.includes("pathogenic")) {
        return "bg-red-100 text-red-800"
    } else if (lowercaseClass.includes("benign")) {
        return "bg-green-100 text-green-800"
    } else {
        return "bg-yellow-100 text-yellow-800"
    }
}

export function getRiskColorClasses(risk: string): string {
    if (!risk) return "bg-gray-100 text-gray-800"
    const lowercaseClass = risk.toLowerCase()

    if (lowercaseClass.includes("high")) {
        return "bg-red-100 text-red-800"
    } else if (lowercaseClass.includes("moderate")) {
        return "bg-yellow-100 text-yellow-800"
    } else if (lowercaseClass.includes("low")) {
        return "bg-green-100 text-green-800"
    } else {
        return "bg-gray-100 text-gray-800"
    }
}

export function getPriorityColorClasses(priority: string): string {
    switch (priority) {
        case "High":   return "bg-red-100 text-red-800"
        case "Medium": return "bg-amber-100 text-amber-800"
        case "Low":    return "bg-green-100 text-green-800"
        default:       return "bg-gray-100 text-gray-800"
    }
}