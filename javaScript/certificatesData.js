// js/certificatesData.js
// Named export so certificatesSection.js can `import { certificates } ...`

/**
 * @typedef {Object} CertificateItem
 * @property {string} id
 * @property {string} title               // Shown in the vertical list
 * @property {number} presetIndex         // Which camera/world preset to use
 * @property {string} loader              // Module path for the loader
 * @property {Object} opts                // Options passed to the loader
 * @property {string} opts.url            // PDF file path (same origin)
 * @property {number=} opts.pageNumber    // 1-based page index
 * @property {number=} opts.width         // Plane width in world units
 * @property {number[]=} opts.position    // [x,y,z] offset (optional)
 * @property {number[]=} opts.rotation    // [rx,ry,rz] in radians (optional)
 */

export const certificates = [
  /** @type {CertificateItem} */
  {
    id: 'negotiation-seminar',
    title: 'Verhandlungsführung Blockseminar',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: { url: '/Assets/certificates/Stockerl1.pdf', width: 120, position: [60,85,0] }      // This will change the position of the PDF in the grid itself

  },
  {
    id: 'sap-abap',
    title: 'SAP ABAP Basics',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: {
      url: '/Assets/certificates/certificate2.pdf',
      pageNumber: 1,
      width: 120,
    }
  },
  {
    id: 'python-data',
    title: 'Python for Data Analysis',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: {
      url: '/Assets/certificates/certificate3.pdf',
      pageNumber: 1,
      width: 120,
    }
  },
    {
    id: 'sap-abap',
    title: 'SAP ABAP Basics',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: {
      url: '/Assets/certificates/certificate2.pdf',
      pageNumber: 1,
      width: 120,
    }
  },
    {
    id: 'sap-abap',
    title: 'SAP ABAP Basics',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: {
      url: '/Assets/certificates/certificate2.pdf',
      pageNumber: 1,
      width: 120,
    }
  },
    {
    id: 'sap-abap',
    title: 'SAP ABAP Basics',
    presetIndex: 4,
    loader: './loaders/loaderPDF.js',
    opts: {
      url: '/Assets/certificates/certificate2.pdf',
      pageNumber: 1,
      width: 120,
    }
  },
];


