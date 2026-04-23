from fpdf import FPDF
import os

pdf = FPDF()
pdf.set_auto_page_break(auto=True, margin=15)

# Text content for the pages
pages_content = [
    """Page 1: Introduction to Biology

Biology is the scientific study of life. It is a natural science with a broad scope but has several unifying themes that tie it together as a single, coherent field. For instance, all organisms are made up of cells that process hereditary information encoded in genes, which can be transmitted to future generations. 

Another major theme is evolution, which explains the unity and diversity of life. Energy processing is also important to life as it allows organisms to move, grow, and reproduce. Finally, all organisms are able to regulate their own internal environments.

Biologists are able to study life at multiple levels of organization, from the molecular biology of a cell to the anatomy and physiology of plants and animals, and evolution of populations. Hence, there are multiple subdisciplines within biology, each defined by the nature of their research questions and the tools that they use. Like other scientists, biologists use the scientific method to make observations, pose questions, generate hypotheses, perform experiments, and form conclusions about the world around them.""",

    """Page 2: Cellular Structure and Function

Cells are the fundamental units of life. Whether an organism is single-celled or multicellular, all of its functions depend on cellular activity. There are two primary categories of cells: prokaryotic and eukaryotic.

Prokaryotic cells are incredibly simple and lack a membrane-bound nucleus and organelles. Bacteria and Archaea fall into this category. They were the first forms of life on Earth. Despite their simplicity, they are highly adaptable and can survive in extreme environments.

Eukaryotic cells, on the other hand, are much more complex. They contain a nucleus that houses DNA, and various specialized structures known as organelles. These include mitochondria for energy production, endoplasmic reticulum for protein synthesis, and Golgi apparatus for packaging. Plants, animals, fungi, and protists rely entirely on eukaryotic cell structures to function.""",

    """Page 3: Genetics and Heredity

Genetics is the study of genes, genetic variation, and heredity in organisms. It is a critical aspect of biology that explains how traits are passed from parents to offspring. The fundamental unit of heredity is the gene, which is a specific sequence of DNA that encodes instructions for building proteins.

Gregor Mendel, an Austrian monk, is considered the father of modern genetics. Through his work with pea plants, he discovered the basic principles of inheritance. He deduced that genes come in pairs and are inherited as distinct units, one from each parent. Mendel tracked the segregation of parental genes and their appearance in the offspring as dominant or recessive traits.

Modern genetics has expanded far beyond Mendel's peas. With the discovery of the double helix structure of DNA by Watson and Crick (and the crucial contributions of Rosalind Franklin), scientists began to understand exactly how DNA replicates and how mutations can lead to genetic diversity or diseases.""",

    """Page 4: Evolutionary Biology

Evolution is the process by which populations of organisms change over generations. Genetic variations underlie these changes; traits that offer an advantage in survival and reproduction are more likely to be passed down.

Charles Darwin famously articulated the mechanism of evolution known as natural selection. According to this theory, organisms produce more offspring than can survive in their environment. Those that are better physically equipped to survive, grow to maturity, and reproduce. 

Evolutionary biology is not just a historical science; it has practical applications today. Understanding evolution helps us combat antibiotic-resistant bacteria, protect endangered species, and even trace the lineage of modern diseases to find cures.""",

    """Page 5: Ecology and Ecosystems

Ecology is the study of the relationships between living organisms, including humans, and their physical environment. It seeks to understand the vital connections between plants and animals and the world around them. 

An ecosystem includes all the living things (plants, animals, and organisms) in a given area, interacting with each other, and also with their non-living environments (weather, earth, sun, soil, climate, atmosphere). In an ecosystem, each organism has its own niche or role to play. 

Food webs and energy pyramids are essential concepts in ecology, illustrating how energy flows through an ecosystem from producers (like plants) to primary consumers (herbivores), secondary consumers (carnivores), and finally to decomposers. Decomposers, such as fungi and bacteria, break down dead organisms, returning vital nutrients to the soil to sustain the cycle of life."""
]

class DocPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Fundamentals of Biology', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

for i, content in enumerate(pages_content):
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    # Print the page number as a header for clarity
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt=f"Chapter {i+1}", ln=True, align='L')
    pdf.ln(10)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=content)

desktop_path = r"C:\Users\dpvas\OneDrive\Documents\Desktop\Biology_Fundamentals_5_Pages.pdf"
pdf.output(desktop_path)
print(f"Successfully generated PDF at: {desktop_path}")
