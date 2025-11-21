
import type { Course } from '../types';

const triggerDownload = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportToMarkdown = (course: Course) => {
    let markdown = `# ${course.title}\n\n`;
    markdown += `**Description:** ${course.description}\n\n`;
    markdown += `**Estimated Duration:** ${course.estimatedDuration}\n\n`;
    markdown += '---\n\n';

    course.modules.forEach((module, index) => {
        markdown += `## Module ${index + 1}: ${module.title}\n\n`;
        // Convert basic HTML to Markdown
        const detailedContentMD = module.detailedContent
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<ul>/g, '')
            .replace(/<\/ul>/g, '')
            .replace(/<li>/g, '* ')
            .replace(/<\/li>/g, '\n');
        markdown += `${detailedContentMD}\n\n`;
        
        if (module.exercise) {
            markdown += `### Practical Exercise\n\n`;
            markdown += `${module.exercise}\n\n`;
        }
        if (module.exerciseSolution) {
            markdown += `**Solution:**\n\n`;
            markdown += `\`\`\`\n${module.exerciseSolution}\n\`\`\`\n\n`;
        }
        markdown += '---\n\n';
    });
    
    markdown += `## Conclusion\n\n${course.conclusion}\n`;

    triggerDownload(markdown, `${course.title.replace(/\s+/g, '_')}.md`, 'text/markdown');
};


export const exportToPlainText = (course: Course) => {
    let text = `${course.title}\n\n`;
    text += `Description: ${course.description}\n\n`;
    text += `Estimated Duration: ${course.estimatedDuration}\n\n`;
    text += '====================================\n\n';

    course.modules.forEach((module, index) => {
        text += `MODULE ${index + 1}: ${module.title}\n\n`;
        // Strip HTML tags for plain text
        const detailedContentText = module.detailedContent.replace(/<[^>]+>/g, '');
        text += `${detailedContentText}\n\n`;

        if (module.exercise) {
            text += `PRACTICAL EXERCISE:\n${module.exercise}\n\n`;
        }
        if (module.exerciseSolution) {
            text += `SOLUTION:\n${module.exerciseSolution}\n\n`;
        }
        text += '------------------------------------\n\n';
    });

    text += `CONCLUSION:\n${course.conclusion}\n`;

    triggerDownload(text, `${course.title.replace(/\s+/g, '_')}.txt`, 'text/plain');
};