# PDF Export - Quick Start Guide

## 🚀 How to Use

### For End Users

1. **Navigate** to any admin page:
   - Admin → Participants
   - Admin → Events
   - Admin → Event Details
   - Admin → Activity Logs

2. **Click** the "Export PDF" button in the top right corner

3. **Download** automatically starts - PDF saved with timestamp

That's it! ✅

---

## 📍 Export Button Locations

### AdminParticipants
```
Header → [Refresh] [Export PDF] [Add Participant] [Theme]
```

### EventDetails
```
Header → [Add Participants] [Sync Google Sheet] [Export PDF] [Theme]
```

### AdminEvents
```
Header → [Refresh] [Export PDF] [Create Event] [Theme]
```

### AdminLogs
```
Header → [Refresh] [Export PDF] [Theme]
```

---

## 📄 What Gets Exported

### Participants Export
- Name, Email, Certificate ID
- Event Name & Code
- Status (Active/Revoked)
- Created Date
- **Summary:** Total, Active, Revoked counts

### Events Export
- Event Name & Code
- Event Date
- Participant Count
- Status (Active/Inactive)
- **Summary:** Total events, Active events

### Activity Logs Export
- User Email
- Action Performed
- Metadata/Details
- Timestamp
- **Summary:** Total activities

---

## 💡 Tips

- **Filtering:** Export respects current search/filter settings
- **Filename:** Includes timestamp for easy identification
- **Disabled:** Button grayed out when no data available
- **Notification:** Success message appears after export
- **Format:** Professional A4 PDF with VerifyAura branding

---

## 🎨 PDF Features

✅ Auto-generated header with logo
✅ Summary statistics at top
✅ Striped table for readability
✅ Page numbers on every page
✅ Generation timestamp
✅ Professional formatting

---

## 🛠️ For Developers

### Add Export to New Page

```typescript
// 1. Import
import { exportToPDF } from "@/utils/pdfExport";
import { useToast } from "@/components/ui/use-toast";

// 2. Add handler
const handleExportPDF = () => {
  try {
    exportMyDataToPDF(data);
    toast({
      title: "✅ Export Successful",
      description: "Data exported to PDF.",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to export PDF.",
      variant: "destructive",
    });
  }
};

// 3. Add button
<Button onClick={handleExportPDF} disabled={!data.length}>
  <Download className="h-4 w-4 mr-2" />
  Export PDF
</Button>
```

---

## 📦 Files Modified

```
frontend/
├── src/
│   ├── utils/
│   │   └── pdfExport.ts              ← NEW: Core export utilities
│   └── pages/
│       └── admin/
│           ├── AdminParticipants.tsx  ← UPDATED
│           ├── EventDetails.tsx       ← UPDATED
│           ├── AdminEvents.tsx        ← UPDATED
│           └── AdminLogs.tsx          ← UPDATED
└── package.json                       ← UPDATED: New dependencies
```

---

## 🎯 Next Steps

After implementing PDF export, consider:
1. Testing with large datasets
2. Verifying on different browsers
3. Collecting user feedback
4. Adding more export formats (CSV, Excel)
5. Implementing export scheduling

---

**Need help?** Check `PDF_EXPORT_FEATURE.md` for complete documentation!
