# ACF Layout Mapping Table

Dit document toont de exacte mapping tussen WordPress ACF layouts en Next.js componenten, gebaseerd op de live WordPress installatie.

## Veldgroep: Page Builder
- **ACF Veld naam**: `page_builder` 
- **Type**: Flexible Content
- **Locatie**: Pagina's met "Standaard template"

## Layout Mappings

| ACF Layout Name | ACF Key | Next.js Component | Beschrijving |
|----------------|---------|-------------------|--------------|
| Text Content | `text_content` | `TextContent` | Tekst sectie met styling opties |
| Image Text Block | `image_text_block` | `ImageTextBlock` | Combinatie van afbeelding en tekst |
| Product Show case | `product_show_case` | `ProductShowcase` | Product grid weergave |
| Text Box | `text_box` | `TextBox` | Eenvoudige tekstbox |
| Product | `product` | `ProductSingle` | Enkel product weergave |
| FAQ | `faq` | `FAQSection` | Veelgestelde vragen |
| Video | `video` | `VideoSection` | Video embed sectie |
| Timeline | `timeline` | `Timeline` | Timeline weergave |
| Contact | `contact` | `ContactSection` | Contact met map en form |
| Fancy Product | `fancy_product` | `FancyProduct` | Geavanceerde product weergave |
| Infobox | `infobox` | `Infobox` | Informatie box |

## Text Content Velden

Gebaseerd op WordPress ACF analyse:

```php
// ACF Fields voor text_content layout:
'title' => 'Tekst veld',
'content' => 'WYSIWYG editor', // Required field
'min_height' => 'Nummer veld',
'background_color' => 'Kleurkiezer',  
'background' => 'Afbeelding veld',
'text_color' => 'Kleurkiezer',
'ovelay' => 'Waar/Niet waar' // Let op: typo in ACF setup
```

### Next.js Props:
```typescript
interface TextContentProps {
  title?: string;
  content: string; // Required
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlay?: boolean; // Maps to 'ovelay' ACF field
}
```

## Contact Layout Velden

```php
// ACF Fields voor contact layout:
'image' => 'Afbeelding veld',
'google_map' => 'Tekst veld (HTML iframe)',
'contact_from_shortcode' => 'Tekst veld' // WordPress shortcode
```

### Next.js Props:
```typescript
interface ContactSectionProps {
  image?: string;
  googleMap?: string; // HTML iframe code
  contactFormShortcode?: string; // e.g. "[wasgeurtje_contact_form]"
}
```

## WordPress REST API Call

```javascript
// Haal pagina op met ACF data
const response = await fetch(`/api/wordpress/pages?slug=contact`);
const page = await response.json();

// Page Builder velden zitten in:
const pageBuilderData = page.acf?.page_builder; // Array van layouts

// Transform naar components:
const components = transformFlexibleContent(pageBuilderData);
```

## Voorbeeld API Response

```json
{
  "id": 25,
  "slug": "contact",
  "title": "Contact",
  "acf": {
    "page_builder": [
      {
        "acf_fc_layout": "text_content",
        "title": "Laat een bericht achter",
        "content": "<p>Heeft u een vraag over uw bestelling...</p>",
        "background_color": "#F8F6F0",
        "text_color": "#333333",
        "min_height": 300,
        "ovelay": false
      },
      {
        "acf_fc_layout": "contact", 
        "image": null,
        "google_map": "<iframe src=\"https://www.google.com/maps/embed...\"></iframe>",
        "contact_from_shortcode": "[wasgeurtje_contact_form]"
      }
    ]
  }
}
```

## Component Usage

```jsx
// In Next.js page
import { ComponentRenderer } from '@/components/wordpress/ComponentRegistry';

export default function DynamicPage({ page }) {
  const components = transformFlexibleContent(page.acf?.page_builder || []);
  
  return (
    <main>
      <ComponentRenderer components={components} />
    </main>
  );
}
```

## Notes

1. **ACF Field Names**: Gebruik exact de namen die in WordPress staan (let op typfouten zoals "ovelay")
2. **Required Fields**: Content veld is verplicht in text_content layout
3. **Shortcodes**: WordPress shortcodes vereisen extra processing voor volledige functionaliteit
4. **Images**: ACF image velden bevatten object met `url` property
5. **HTML Content**: Google Maps en WYSIWYG content kan HTML bevatten

## Testing

Test je mapping met:
1. `/debug-wordpress` - Debug tool voor API responses
2. `/test-content` - Test component rendering
3. WordPress Preview functie met Next.js preview mode


