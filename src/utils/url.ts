const domains = ['https://edgeemu.net/', 'https://s1.hexrom.com'];

export const getGameDomainUrl = (url: string): string => {
  let correctDomain = '';
  domains.forEach((domain) => {
    if (url.includes(domain)) {
      correctDomain = domain;
    }
  });

  return correctDomain;
};
