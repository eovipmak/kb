// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Vinahost Knowledge Base',
  tagline: 'VinaHost - Nhà cung cấp dịch vụ Hosting - VPS hàng đầu tại Việt Nam',
  favicon: 'img/logo_icon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://eovipmak.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: 'kb',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [require.resolve('docusaurus-lunr-search')],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social-card.png',
      navbar: {
        title: 'Trung tâm hỗ trợ trực tuyến VinaHost',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo_icon.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tài liệu',
          },
          {
            href: 'https://vinahost.vn/blog/',
            label: 'Blog',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Tổng đài hỗ trợ',
            items: [
              {
                label: 'Livechat 24/7',
                href: 'https://livechat.vinahost.vn',
              },
              {
               html: 'Hotline: 1900-6046 ext 3'
              },
              {
                label: 'Email/Ticket',
                href: 'mailto:support@vinahost.vn'
              },
            ],
          },
          {
            title: 'Trang chủ VinaHost',
            items: [
              {
                label: 'Hosting giá rẻ',
                href: 'https://vinahost.vn/hosting-gia-re/',
              },
              {
                label: 'VPS giá rẻ',
                href: 'https://vinahost.vn/thue-vps-gia-re/',
              },
              {
                label: 'SSL giá rẻ',
                href: 'https://vinahost.vn/mua-ssl-gia-re/',
              },
              {
                label: 'Email doanh nghiệp',
                href: 'https://vinahost.vn/email-hosting-chuyen-nghiep/',
              },
            ],
          },
          {
            title: 'Công ty TNHH VINAHOST',
            items: [
              {
                label: 'Giới thiệu',
                href: 'https://vinahost.vn/gioi-thieu/',
              },
              {
                label: 'Tuyển dụng',
                href: 'https://vinahost.vn/tuyen-dung/',
              },
              {
                label: 'Chính sách bảo mật',
                href: 'https://vinahost.vn/chinh-sach-bao-mat/',
              },
              {
                label: 'Thanh toán',
                href: 'https://vinahost.vn/thanh-toan/',
              },
            ],
          },
          {
            title: 'Khác',
            items: [
              {
                label: 'Thuê máy chủ riêng',
                href: 'https://vinahost.vn/thue-may-chu-rieng/',
              },
              {
                label: 'Alibaba Cloud',
                href: 'https://vinahost.vn/alibaba-cloud-gia-re/',
              },
              {
                label: 'Đăng ký tên miền',
                href: 'https://vinahost.vn/dang-ky-ten-mien/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()}  Công ty TNHH VINAHOST.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
