import * as React from 'react';
import * as cx from 'classnames';
import * as _ from 'lodash-es';
import { Converter } from 'showdown';
import * as sanitizeHtml from 'sanitize-html';
import { useTranslation } from 'react-i18next';

import './_markdown-view.scss';

const tableTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];

const markdownConvert = (markdown, extensions?: string[]) => {
  const unsafeHtml = new Converter({
    tables: true,
    openLinksInNewWindow: true,
    strikethrough: true,
    emoji: true,
    extensions,
  }).makeHtml(markdown);

  return sanitizeHtml(unsafeHtml, {
    allowedTags: [
      'b',
      'i',
      'strike',
      's',
      'del',
      'em',
      'strong',
      'a',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'button',
      ...tableTags,
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'data-*'],
      button: ['class', 'data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
};

type SyncMarkdownProps = {
  content?: string;
  emptyMsg?: string;
  exactHeight?: boolean;
  truncateContent?: boolean;
  extensions?: string[];
  renderExtension?: (contentDocument: HTMLDocument, rootSelector: string) => React.ReactNode;
  inline?: boolean;
};

type InnerSyncMarkdownProps = Pick<SyncMarkdownProps, 'renderExtension' | 'exactHeight'> & {
  markup: string;
  isEmpty: boolean;
};

export const SyncMarkdownView: React.FC<SyncMarkdownProps> = ({
  truncateContent,
  content,
  emptyMsg,
  extensions,
  renderExtension,
  exactHeight,
  inline,
}) => {
  const { t } = useTranslation();
  const markup = React.useMemo(() => {
    const truncatedContent = truncateContent
      ? _.truncate(content, {
          length: 256,
          separator: ' ',
          omission: '\u2026',
        })
      : content;
    return markdownConvert(truncatedContent || emptyMsg || t('utils~Not available'), extensions);
  }, [content, emptyMsg, extensions, t, truncateContent]);
  const innerProps: InnerSyncMarkdownProps = {
    renderExtension: extensions?.length > 0 ? renderExtension : undefined,
    exactHeight,
    markup,
    isEmpty: !content,
  };
  return inline ? <InlineMarkdownView {...innerProps} /> : <IFrameMarkdownView {...innerProps} />;
};

const InlineMarkdownView: React.FC<InnerSyncMarkdownProps> = ({
  markup,
  isEmpty,
  renderExtension,
}) => {
  const id = React.useMemo(() => _.uniqueId('markdown'), []);
  return (
    <div className={cx('co-markdown-view', { ['is-empty']: isEmpty })} id={id}>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      {renderExtension && renderExtension(document, `#${id}`)}
    </div>
  );
};

const IFrameMarkdownView: React.FC<InnerSyncMarkdownProps> = ({
  exactHeight,
  markup,
  isEmpty,
  renderExtension,
}) => {
  const [frame, setFrame] = React.useState<HTMLIFrameElement>();
  const [loaded, setLoaded] = React.useState(false);
  const updateTimeoutHandle = React.useRef<number>();

  const updateDimensions = React.useCallback(() => {
    if (!frame?.contentWindow?.document.body.firstChild) {
      return;
    }
    frame.style.height = `${frame.contentWindow.document.body.firstElementChild.scrollHeight}px`;

    // Let the new height take effect, then reset again once we recompute
    updateTimeoutHandle.current = setTimeout(() => {
      if (exactHeight) {
        frame.style.height = `${frame.contentWindow.document.body.firstElementChild.scrollHeight}px`;
      } else {
        // Increase by 15px for the case where a horizontal scrollbar might appear
        frame.style.height = `${frame.contentWindow.document.body.firstElementChild.scrollHeight +
          15}px`;
      }
    });
  }, [frame, exactHeight]);

  React.useEffect(
    () => () => {
      clearTimeout(updateTimeoutHandle.current);
    },
    [],
  );

  const onLoad = React.useCallback(() => {
    updateDimensions();
    setLoaded(true);
  }, [updateDimensions]);

  // Find the app's stylesheets and inject them into the frame to ensure consistent styling.
  const filteredLinks = Array.from(document.getElementsByTagName('link')).filter((l) =>
    _.includes(l.href, 'app-bundle'),
  );

  const linkRefs = _.reduce(
    filteredLinks,
    (refs, link) => `${refs}
    <link rel="stylesheet" href="${link.href}">`,
    '',
  );

  const contents = `
  ${linkRefs}
  <style type="text/css">
  body {
    background-color: transparent !important;
    color: ${isEmpty ? '#999' : '#333'};
    font-family: var(--pf-global--FontFamily--sans-serif);
    min-width: auto !important;
  }
  table {
    display: block;
    margin-bottom: 11.5px;
    overflow-x: auto;
  }
  td,
  th {
    border-bottom: 1px solid #ededed;
    padding: 10px;
    vertical-align: top;
  }
  th {
    padding-top: 0;
  }
  </style>
  <body class="pf-m-redhat-font"><div style="overflow-y: auto;">${markup}</div></body>`;
  return (
    <>
      <iframe
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        srcDoc={contents}
        style={{ border: '0px', display: 'block', width: '100%', height: '0' }}
        ref={(r) => setFrame(r)}
        onLoad={() => onLoad()}
      />
      {loaded && frame && renderExtension && renderExtension(frame.contentDocument, '')}
    </>
  );
};
