export const TOY_CATEGORIES = [
    'Animals',
    'Vehicles',
    'Fantasy and Science Fiction',
    'Occupations and Roles',
    'Nature and Environment',
    'Buildings and Structures',
    'Sports and Activities',
    'Educational',
    'Daily Life and Household Items',
    'Food',
];

export const TOY_COLORS = [
    'Red',
    'Orange',
    'Yellow',
    'Green',
    'Blue',
    'Purple',
    'Brown',
    'White',
    'Black',
    'Multi-colored',
];

export const TOY_MATERIALS = [
    'Wood',
    'Metal',
    'Plastic',
    'Fabric',
    'Paper',
    'Cardboard',
    'Clay',
    'Glass',
    'Rubber',
    'Other',
];

export function getToyGenerationPrompt(toy_category, toy_colour, toy_material, toy_size, toy_age_range, toy_customization, customised_name) {
    return `
    You are an expert at prompt engineering and a toy maker. Below are categories for the toy given by the user: 
    
    Type of Toy: ${toy_category}
    Color: ${toy_colour}
    Material: ${toy_material} 
    Size: ${toy_size} cm
    Age Range: ${toy_age_range}
    Customization: ${toy_customization ?? 'None'}
    Customized name: ${customised_name ?? 'None'}

    Describe it in a short text of the final object for me to input in a tool that generates 3d model. 
    Make sure your output is short and dont generate any additional text apart from the prompt. 
    Be specific and not generic, 
    For example: if its animal you can give it a dog/cat, if its vehicle you can give truck/aeroplane/car etc.
    `;
}

export const TEXT_TO_3D_MODEL_PROMPT = `
A gray baby elephant with large floppy ears and a long trunk in the form of a stuffed animal
`;
