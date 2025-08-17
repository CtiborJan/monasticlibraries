<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:php="http://php.net/xsl"
    exclude-result-prefixes="w"
    >
    <xsl:output method="text" omit-xml-declaration="yes" encoding="UTF-8"/> 
    <xsl:template match="//w:body">
				<xsl:apply-templates match="w:p[not(contains(w:pPr/w:pStyle/@w:val,'Nadpis') or contains(w:pPr/w:pStyle/@w:val,'Heading')) or not(w:pPr/w:pStyle) or not(w:pPr)]"/>
    </xsl:template>
    <xsl:template match="w:p[(not(contains(w:pPr/w:pStyle/@w:val,'Nadpis') or contains(w:pPr/w:pStyle/@w:val,'Heading')) or not(w:pPr/w:pStyle) or not(w:pPr))]">
       ("<xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Nadpis1'][1]"/><xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Heading1'][1]"/>"
		"<xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Nadpis2'][1]"/><xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Heading2'][1]"/>"
		"<xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Nadpis3'][1]"/><xsl:value-of select="./preceding::w:p[w:pPr/w:pStyle/@w:val='Heading3'][1]"/>"
		"<xsl:apply-templates match=".//w:r"/>")</xsl:template>
    
    <xsl:template match="w:p"/>

    <xsl:template match="w:r">
    
<!--       <xsl:variable name="rtf_scaps"> -->
          <xsl:choose>
            <xsl:when test="count(.//w:smallCaps) &gt; 0">\scaps:1<xsl:apply-templates match=".//w:t" />\scaps:0</xsl:when>
<!--       </xsl:variable> -->
        
<!--       <xsl:variable name="rtf_i"> -->
            <xsl:when test="count(.//w:i) &gt; 0">\i:1<xsl:apply-templates match=".//w:t" />\i:0</xsl:when>
            <xsl:otherwise><xsl:apply-templates match=".//w:t" /></xsl:otherwise>
            </xsl:choose>
<!--       </xsl:variable> -->
        
      <!--<xsl:variable name="rtf" select="concat($rtf_scaps,$rtf_i,' ')"/> 

        <xsl:choose>
          <xsl:when test="$rtf = ' '">
            <xsl:apply-templates match=".//w:t"/>
          </xsl:when>
          <xsl:otherwise>
            {<xsl:value-of select="$rtf"/> <xsl:apply-templates match=".//w:t" />}
          </xsl:otherwise>
        </xsl:choose>-->
    </xsl:template>

    <xsl:template match="w:t">
		<xsl:value-of select="php:function('replace_quotes',./text())"/>
    </xsl:template>
</xsl:stylesheet>
